import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  AssignEmployeeToSubscriptionRequestDto,
  ConsumeCreditsFromEmployeeSubscriptionRequestDto,
} from './models/employee-subscription.request';
import {
  CreateBulkEmployeeSubscriptionRequestDto,
  GetOrganizationMembersRequestDto,
} from './models/bulk-employee-subscription.request';
import {
  EmployeeSubscriptionWithCreditsResponseDto,
  EmployeeAssignmentResponseDto,
  EmployeeSubscriptionUsageReportResponseDto,
} from './models/employee-subscription.response';
import {
  OrganizationMemberResponseDto,
  BulkEmployeeSubscriptionResponseDto,
} from './models/bulk-employee-subscription.response';
import { CreditConsumptionResponseDto } from './models/subscription.response';
import {
  CreditTransactionType,
  SubscriptionPlan,
  SubscriptionStatus,
} from '@/common/entities';

@Injectable()
export class EmployeeSubscriptionService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrganizationMembers(
    organizationId: string,
    requesterId: string,
    filters?: GetOrganizationMembersRequestDto,
  ): Promise<OrganizationMemberResponseDto[]> {
    // Verify that the requester has permission to view organization members
    const requesterMember = await this.prisma.member.findFirst({
      where: {
        userId: requesterId,
        organizationId,
        role: 'OWNER',
      },
    });

    if (!requesterMember) {
      throw new ForbiddenException('Only organization owners can view members');
    }

    const whereClause: any = {
      organizationId,
    };

    if (filters?.role) {
      whereClause.role = filters.role;
    }

    const members = await this.prisma.member.findMany({
      where: whereClause,
      include: {
        user: true,
        organization: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    let filteredMembers = members;

    // Apply search filter if provided
    if (filters?.search) {
      const searchTerm = filters.search.toLowerCase();
      filteredMembers = members.filter(
        (member) =>
          member.user.name?.toLowerCase().includes(searchTerm) ||
          member.user.email.toLowerCase().includes(searchTerm),
      );
    }

    // Check if each member already has employee subscription access
    const memberIds = filteredMembers.map((member) => member.userId);
    const existingSubscriptions =
      await this.prisma.employeeSubscription.findMany({
        where: {
          userId: { in: memberIds },
          organizationId,
          isActive: true,
        },
        include: {
          subscription: true,
        },
      });

    const subscriptionMap = new Map(
      existingSubscriptions.map((es) => [
        es.userId,
        {
          hasSubscription: true,
          plan: es.subscription.plan,
        },
      ]),
    );

    return filteredMembers.map((member) => {
      const subscriptionInfo = subscriptionMap.get(member.userId);
      return {
        id: member.userId,
        name: member.user.name,
        email: member.user.email,
        role: member.role as 'OWNER' | 'EMPLOYEE',
        memberId: member.id,
        joinedAt: member.createdAt,
        hasEmployeeSubscription: subscriptionInfo?.hasSubscription || false,
        currentSubscriptionPlan: subscriptionInfo?.plan,
      };
    });
  }

  async createBulkEmployeeSubscription(
    ownerId: string,
    data: CreateBulkEmployeeSubscriptionRequestDto,
  ): Promise<BulkEmployeeSubscriptionResponseDto> {
    // Verify that the user has permission to create subscriptions for this organization
    const member = await this.prisma.member.findFirst({
      where: {
        userId: ownerId,
        organizationId: data.organizationId,
        role: 'OWNER',
      },
      include: {
        organization: true,
      },
    });

    if (!member) {
      throw new ForbiddenException(
        'Only organization owners can create employee subscriptions',
      );
    }

    // Verify all employee IDs are valid members of the organization
    const employees = await this.prisma.member.findMany({
      where: {
        userId: { in: data.employeeUserIds },
        organizationId: data.organizationId,
        role: 'EMPLOYEE',
      },
      include: {
        user: true,
      },
    });

    const validEmployeeIds = employees.map((emp) => emp.userId);
    const invalidEmployeeIds = data.employeeUserIds.filter(
      (id) => !validEmployeeIds.includes(id),
    );

    if (invalidEmployeeIds.length > 0) {
      throw new BadRequestException(
        `Invalid employee IDs or not members of organization: ${invalidEmployeeIds.join(', ')}`,
      );
    }

    // Calculate credits based on plan and billing period
    const totalCredits = this.calculateTotalCredits(
      data.plan,
      data.billingPeriod,
    );

    // Calculate period end based on billing period
    const periodEnd = this.calculatePeriodEnd(data.billingPeriod);

    // Create the employee subscription
    const subscription = await this.prisma.subscription.create({
      data: {
        userId: ownerId, // Owner pays for the subscription
        revenueCatCustomerId: data.revenueCatCustomerId,
        plan: data.plan,
        status: data.status,
        billingPeriod: data.billingPeriod,
        currentPeriodStart: new Date(),
        currentPeriodEnd: periodEnd,
        totalCredits,
        isEmployeeSubscription: true,
        sponsorOrganizationId: data.organizationId,
        maxEmployees: data.employeeUserIds.length,
      },
    });

    // Create initial credit allocation transaction
    if (totalCredits > 0) {
      await this.prisma.creditTransaction.create({
        data: {
          userId: ownerId,
          organizationId: data.organizationId,
          subscriptionId: subscription.id,
          type:
            data.plan === SubscriptionPlan.TRIAL
              ? CreditTransactionType.TRIAL_ALLOCATION
              : CreditTransactionType.PERIOD_ALLOCATION,
          amount: totalCredits,
          description: `Bulk employee subscription credit allocation for ${data.plan} plan (${data.billingPeriod} ${data.plan === 'TRIAL' ? 'days' : 'months'})`,
        },
      });
    }

    // Assign all employees to the subscription
    const assignments: any[] = [];
    const failedAssignments: string[] = [];

    for (const employeeId of validEmployeeIds) {
      try {
        // Check if employee already has an active assignment for this organization
        const existingAssignment =
          await this.prisma.employeeSubscription.findFirst({
            where: {
              userId: employeeId,
              organizationId: data.organizationId,
              isActive: true,
            },
          });

        if (!existingAssignment) {
          const assignment = await this.prisma.employeeSubscription.create({
            data: {
              subscriptionId: subscription.id,
              userId: employeeId,
              organizationId: data.organizationId,
            },
          });
          assignments.push(assignment);
        } else {
          // Employee already has active subscription for this organization
          failedAssignments.push(employeeId);
        }
      } catch {
        failedAssignments.push(employeeId);
      }
    }

    const subscriptionWithCredits =
      this.calculateEmployeeSubscriptionCreditSummary(
        subscription,
        member.organization?.name,
      );

    return {
      subscription: subscriptionWithCredits,
      employeeAssignments: assignments,
      totalEmployeesAssigned: assignments.length,
      failedAssignments,
      summary: `Successfully created ${data.plan} subscription for ${data.billingPeriod} ${data.plan === 'TRIAL' ? 'days' : 'months'} and assigned to ${assignments.length} employees`,
    };
  }

  async assignEmployeeToSubscription(
    subscriptionId: string,
    assignerId: string,
    data: AssignEmployeeToSubscriptionRequestDto,
  ): Promise<EmployeeAssignmentResponseDto> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { sponsorOrganization: true },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    if (!subscription.isEmployeeSubscription) {
      throw new BadRequestException('This is not an employee subscription');
    }

    // Verify that the assigner has permission
    const assignerMember = await this.prisma.member.findFirst({
      where: {
        userId: assignerId,
        organizationId: subscription.sponsorOrganizationId!,
        role: 'OWNER',
      },
    });

    if (!assignerMember) {
      throw new ForbiddenException(
        'Only sponsor organization owners can assign employees',
      );
    }

    // Check if assignment already exists
    const existingAssignment =
      await this.prisma.employeeSubscription.findUnique({
        where: {
          subscriptionId_userId_organizationId: {
            subscriptionId,
            userId: data.userId,
            organizationId: data.organizationId,
          },
        },
      });

    if (existingAssignment) {
      if (existingAssignment.isActive) {
        throw new BadRequestException(
          'Employee is already assigned to this subscription',
        );
      } else {
        // Reactivate existing assignment
        const reactivated = await this.prisma.employeeSubscription.update({
          where: { id: existingAssignment.id },
          data: {
            isActive: true,
            revokedAt: null,
          },
        });
        return reactivated as EmployeeAssignmentResponseDto;
      }
    }

    // Check max employees limit
    if (subscription.maxEmployees) {
      const currentAssignments = await this.prisma.employeeSubscription.count({
        where: {
          subscriptionId,
          isActive: true,
        },
      });

      if (currentAssignments >= subscription.maxEmployees) {
        throw new BadRequestException(
          `Maximum employee limit (${subscription.maxEmployees}) reached`,
        );
      }
    }

    // Verify the employee exists and is a member of the target organization
    const employeeMember = await this.prisma.member.findFirst({
      where: {
        userId: data.userId,
        organizationId: data.organizationId,
      },
    });

    if (!employeeMember) {
      throw new BadRequestException(
        'User is not a member of the target organization',
      );
    }

    const assignment = await this.prisma.employeeSubscription.create({
      data: {
        subscriptionId,
        userId: data.userId,
        organizationId: data.organizationId,
      },
    });

    return assignment as EmployeeAssignmentResponseDto;
  }

  async revokeEmployeeFromSubscription(
    subscriptionId: string,
    userId: string,
    organizationId: string,
    revokerId: string,
  ): Promise<EmployeeAssignmentResponseDto> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    // Verify that the revoker has permission
    const revokerMember = await this.prisma.member.findFirst({
      where: {
        userId: revokerId,
        organizationId: subscription.sponsorOrganizationId!,
        role: 'OWNER',
      },
    });

    if (!revokerMember) {
      throw new ForbiddenException(
        'Only sponsor organization owners can revoke employee access',
      );
    }

    const assignment = await this.prisma.employeeSubscription.findUnique({
      where: {
        subscriptionId_userId_organizationId: {
          subscriptionId,
          userId,
          organizationId,
        },
      },
    });

    if (!assignment) {
      throw new NotFoundException('Employee assignment not found');
    }

    const revoked = await this.prisma.employeeSubscription.update({
      where: { id: assignment.id },
      data: {
        isActive: false,
        revokedAt: new Date(),
      },
    });

    return revoked as EmployeeAssignmentResponseDto;
  }

  async getEmployeeSubscriptionsForUser(
    userId: string,
  ): Promise<EmployeeSubscriptionWithCreditsResponseDto[]> {
    const assignments = await this.prisma.employeeSubscription.findMany({
      where: {
        userId,
        isActive: true,
      },
      include: {
        subscription: {
          include: {
            sponsorOrganization: true,
          },
        },
      },
    });

    const subscriptions = assignments.map((assignment) => {
      const subscription = assignment.subscription;
      return this.calculateEmployeeSubscriptionCreditSummary(
        subscription,
        subscription.sponsorOrganization?.name,
      );
    });

    return subscriptions;
  }

  async getEmployeeSubscriptionByUserAndOrganization(
    userId: string,
    organizationId: string,
  ): Promise<EmployeeSubscriptionWithCreditsResponseDto | null> {
    const assignment = await this.prisma.employeeSubscription.findFirst({
      where: {
        userId,
        organizationId,
        isActive: true,
      },
      include: {
        subscription: {
          include: {
            sponsorOrganization: true,
          },
        },
      },
    });

    if (!assignment) {
      return null;
    }

    return this.calculateEmployeeSubscriptionCreditSummary(
      assignment.subscription,
      assignment.subscription.sponsorOrganization?.name,
    );
  }

  async consumeCreditsFromEmployeeSubscription(
    userId: string,
    subscriptionId: string,
    data: ConsumeCreditsFromEmployeeSubscriptionRequestDto,
  ): Promise<CreditConsumptionResponseDto> {
    // Verify the employee has access to this subscription in the specified organization
    const assignment = await this.prisma.employeeSubscription.findUnique({
      where: {
        subscriptionId_userId_organizationId: {
          subscriptionId,
          userId,
          organizationId: data.organizationId,
        },
      },
      include: {
        subscription: true,
      },
    });

    if (!assignment || !assignment.isActive) {
      throw new NotFoundException('Employee subscription access not found');
    }

    const subscription = assignment.subscription;

    // Allow credit consumption for TRIAL and AI plans
    if (subscription.plan === SubscriptionPlan.PRO) {
      throw new ForbiddenException(
        'PRO plan subscribers cannot use AI credits',
      );
    }

    if (
      subscription.status !== 'ACTIVE' &&
      subscription.status !== 'TRIALING'
    ) {
      throw new ForbiddenException('Subscription is not active');
    }

    const creditSummary =
      this.calculateEmployeeSubscriptionCreditSummary(subscription);

    if (creditSummary.availableCredits < data.credits) {
      throw new BadRequestException('Insufficient credits');
    }

    // Use credits in priority order: total credits first, then purchased credits
    let creditsToConsume = data.credits;
    let totalCreditsUsed = 0;
    let purchasedCreditsUsed = 0;

    // First, use available total credits
    if (creditSummary.availableTotalCredits > 0) {
      totalCreditsUsed = Math.min(
        creditsToConsume,
        creditSummary.availableTotalCredits,
      );
      creditsToConsume -= totalCreditsUsed;
    }

    // Then, use purchased credits if needed
    if (creditsToConsume > 0) {
      purchasedCreditsUsed = creditsToConsume;
    }

    // Update subscription in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Update subscription counters
      const updatedSubscription = await tx.subscription.update({
        where: { id: subscription.id },
        data: {
          usedCredits: subscription.usedCredits + totalCreditsUsed,
          purchasedCredits:
            subscription.purchasedCredits - purchasedCreditsUsed,
        },
      });

      // Create credit transaction record
      const transaction = await tx.creditTransaction.create({
        data: {
          userId,
          organizationId: data.organizationId,
          subscriptionId: subscription.id,
          type: 'CONSUMED',
          amount: -data.credits, // Negative for consumption
          description: data.description,
          metadata: data.metadata,
        },
      });

      return { updatedSubscription, transaction };
    });

    const remainingCredits = creditSummary.availableCredits - data.credits;

    return {
      creditsConsumed: data.credits,
      totalCreditsUsed,
      purchasedCreditsUsed,
      remainingCredits,
      transactionId: result.transaction.id,
    };
  }

  async getEmployeeSubscriptionUsageReport(
    subscriptionId: string,
    requesterId: string,
  ): Promise<EmployeeSubscriptionUsageReportResponseDto> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        sponsorOrganization: true,
        employeeSubscriptions: {
          where: { isActive: true },
          include: {
            user: true,
            organization: true,
          },
        },
      },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    // Verify that the requester has permission
    const requesterMember = await this.prisma.member.findFirst({
      where: {
        userId: requesterId,
        organizationId: subscription.sponsorOrganizationId!,
        role: 'OWNER',
      },
    });

    if (!requesterMember) {
      throw new ForbiddenException(
        'Only sponsor organization owners can view usage reports',
      );
    }

    const subscriptionSummary = this.calculateEmployeeSubscriptionCreditSummary(
      subscription,
      subscription.sponsorOrganization?.name,
    );

    const assignedEmployees = subscription.employeeSubscriptions.map(
      (assignment) => ({
        id: assignment.id,
        subscriptionId: assignment.subscriptionId,
        userId: assignment.userId,
        organizationId: assignment.organizationId,
        isActive: assignment.isActive,
        assignedAt: assignment.assignedAt,
        revokedAt: assignment.revokedAt,
        createdAt: assignment.createdAt,
        updatedAt: assignment.updatedAt,
      }),
    ) as EmployeeAssignmentResponseDto[];

    return {
      subscription: subscriptionSummary,
      totalCreditsUsed: subscription.usedCredits,
      assignedEmployees,
    };
  }

  private calculateTotalCredits(plan: string, billingPeriod: number): number {
    switch (plan) {
      case 'TRIAL':
        return 50; // 50 credits for 14-day trial
      case 'PRO':
        return 0; // No AI credits for PRO plan
      case 'AI':
        if (billingPeriod === 1) {
          return 100; // 100 credits per month
        } else if (billingPeriod === 6) {
          return 600; // 100 * 6 months upfront
        } else if (billingPeriod === 12) {
          return 1200; // 100 * 12 months upfront
        }
        return 0;
      default:
        return 0;
    }
  }

  private calculatePeriodEnd(billingPeriod: number): Date {
    const now = new Date();
    if (billingPeriod === 14) {
      // Trial period - 14 days
      return new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    } else {
      // Regular billing periods in months
      return new Date(now.getTime() + billingPeriod * 30 * 24 * 60 * 60 * 1000);
    }
  }

  private calculateEmployeeSubscriptionCreditSummary(
    subscription: any,
    sponsorOrganizationName?: string,
  ): EmployeeSubscriptionWithCreditsResponseDto {
    const availableTotalCredits = Math.max(
      0,
      subscription.totalCredits - subscription.usedCredits,
    );
    const availablePurchasedCredits = subscription.purchasedCredits;
    const availableCredits = availableTotalCredits + availablePurchasedCredits;

    const canUseAIFeatures =
      (subscription.plan === SubscriptionPlan.AI ||
        subscription.plan === SubscriptionPlan.TRIAL) &&
      (subscription.status === SubscriptionStatus.ACTIVE ||
        subscription.status === SubscriptionStatus.TRIALING);

    return {
      ...subscription,
      availableCredits,
      availableTotalCredits,
      availablePurchasedCredits,
      canUseAIFeatures,
      assignedEmployeesCount: subscription.employeeSubscriptions?.length || 0,
      sponsorOrganizationName,
    };
  }
}
