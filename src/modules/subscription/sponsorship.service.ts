import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  CreateBulkSponsorshipRequestDto,
  GetOrganizationMembersForSponsorshipRequestDto,
} from './models/sponsorship.request';
import {
  SponsorshipResponseDto,
  SponsorshipWithUserInfoResponseDto,
  OrganizationMemberForSponsorshipResponseDto,
  BulkSponsorshipResponseDto,
  SponsorshipBillingSummaryResponseDto,
} from './models/sponsorship.response';
import {
  SubscriptionPlan,
  SubscriptionStatus,
  CreditTransactionType,
} from '../../common/entities';

@Injectable()
export class SponsorshipService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly PLAN_PRICES = {
    [SubscriptionPlan.PRO]: 9.99,
    [SubscriptionPlan.AI]: 19.99,
  } as const;

  private readonly PLAN_CREDITS = {
    [SubscriptionPlan.TRIAL]: 50,
    [SubscriptionPlan.PRO]: 0,
    [SubscriptionPlan.AI]: 100,
  } as const;

  async getOrganizationMembersForSponsorship(
    organizationId: string,
    sponsorUserId: string,
    filters?: GetOrganizationMembersForSponsorshipRequestDto,
  ): Promise<OrganizationMemberForSponsorshipResponseDto[]> {
    // Verify sponsor has permission
    const sponsorMember = await this.prisma.member.findFirst({
      where: {
        userId: sponsorUserId,
        organizationId,
        role: 'OWNER',
      },
    });

    if (!sponsorMember) {
      throw new ForbiddenException(
        'Only organization owners can manage sponsorships',
      );
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
        user: {
          include: {
            subscriptions: {
              where: { isActive: true },
              include: {
                employeeSubscriptionSponsorship: {
                  where: {
                    organizationId,
                    isActive: true,
                  },
                },
              },
            },
          },
        },
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

    // Apply unsponsored filter if provided
    if (filters?.showUnsponsored) {
      filteredMembers = filteredMembers.filter(
        (member) =>
          !member.user.subscriptions.some(
            (sub) =>
              sub.employeeSubscriptionSponsorship &&
              sub.employeeSubscriptionSponsorship.isActive,
          ),
      );
    }

    return filteredMembers.map((member) => {
      const activeSubscription = member.user.subscriptions.find(
        (sub) => sub.isActive,
      );
      const activeSponsorship =
        activeSubscription?.employeeSubscriptionSponsorship;

      return {
        userId: member.userId,
        userName: member.user.name || '',
        userEmail: member.user.email,
        role: member.role,
        hasActiveSponsorship: !!activeSponsorship,
        currentSponsorship: activeSponsorship
          ? {
              id: activeSponsorship.id,
              subscriptionId: activeSponsorship.subscriptionId,
              sponsorUserId: activeSponsorship.sponsorUserId,
              sponsoredUserId: activeSponsorship.sponsoredUserId,
              organizationId: activeSponsorship.organizationId,
              plan: activeSponsorship.plan as SubscriptionPlan,
              monthlyCost: Number(activeSponsorship.monthlyCost),
              discountApplied: activeSponsorship.discountApplied
                ? Number(activeSponsorship.discountApplied)
                : undefined,
              originalPrice: Number(activeSponsorship.originalPrice),
              isActive: activeSponsorship.isActive,
              sponsoredAt: activeSponsorship.sponsoredAt,
              cancelledAt: activeSponsorship.cancelledAt || undefined,
              createdAt: activeSponsorship.createdAt,
              updatedAt: activeSponsorship.updatedAt,
            }
          : undefined,
        currentPlan:
          (activeSubscription?.plan as SubscriptionPlan) ||
          SubscriptionPlan.TRIAL,
        subscriptionStatus:
          (activeSubscription?.status as SubscriptionStatus) ||
          SubscriptionStatus.TRIALING,
      };
    });
  }

  async createBulkSponsorship(
    organizationId: string,
    sponsorUserId: string,
    createDto: CreateBulkSponsorshipRequestDto,
  ): Promise<BulkSponsorshipResponseDto> {
    // Verify sponsor has permission
    const sponsorMember = await this.prisma.member.findFirst({
      where: {
        userId: sponsorUserId,
        organizationId,
        role: 'OWNER',
      },
      include: {
        user: true,
      },
    });

    if (!sponsorMember) {
      throw new ForbiddenException(
        'Only organization owners can create sponsorships',
      );
    }

    const successful: SponsorshipWithUserInfoResponseDto[] = [];
    const failed: BulkSponsorshipResponseDto['failed'] = [];
    let totalMonthlyCost = 0;

    // Process each employee sponsorship
    for (const employeeData of createDto.employees) {
      try {
        // Verify employee is member of organization
        const employeeMember = await this.prisma.member.findFirst({
          where: {
            userId: employeeData.employeeUserId,
            organizationId,
          },
          include: { user: true },
        });

        if (!employeeMember) {
          failed.push({
            employeeUserId: employeeData.employeeUserId,
            reason: 'User is not a member of this organization',
            userName: 'Unknown',
            userEmail: 'Unknown',
          });
          continue;
        }

        // Check if employee already has active sponsorship
        const existingSponsorship =
          await this.prisma.employeeSubscriptionSponsorship.findFirst({
            where: {
              sponsoredUserId: employeeData.employeeUserId,
              organizationId,
              isActive: true,
            },
          });

        if (existingSponsorship) {
          failed.push({
            employeeUserId: employeeData.employeeUserId,
            reason: 'Employee already has active sponsorship',
            userName: employeeMember.user.name || '',
            userEmail: employeeMember.user.email,
          });
          continue;
        }

        // Calculate pricing
        const originalPrice =
          this.PLAN_PRICES[employeeData.plan as keyof typeof this.PLAN_PRICES];
        if (!originalPrice) {
          failed.push({
            employeeUserId: employeeData.employeeUserId,
            reason: `Invalid plan for sponsorship: ${employeeData.plan}`,
            userName: employeeMember.user.name || '',
            userEmail: employeeMember.user.email,
          });
          continue;
        }

        const discountApplied = process.env.DISCOUNT
          ? parseFloat(process.env.DISCOUNT)
          : 0;
        const monthlyCost = originalPrice * (1 - discountApplied);

        // Create individual subscription for employee
        const subscription = await this.prisma.subscription.create({
          data: {
            userId: employeeData.employeeUserId,
            plan: employeeData.plan,
            status: SubscriptionStatus.ACTIVE,
            billingPeriod: 1,
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            totalCredits: this.PLAN_CREDITS[employeeData.plan],
            usedCredits: 0,
            purchasedCredits: 0,
            isActive: true,
          },
        });

        // Create sponsorship record
        const sponsorship =
          await this.prisma.employeeSubscriptionSponsorship.create({
            data: {
              subscriptionId: subscription.id,
              sponsorUserId,
              sponsoredUserId: employeeData.employeeUserId,
              organizationId,
              plan: employeeData.plan,
              monthlyCost,
              discountApplied: discountApplied > 0 ? discountApplied : null,
              originalPrice,
              isActive: true,
            },
          });

        // Log credit allocation if AI plan
        if (employeeData.plan === SubscriptionPlan.AI) {
          await this.prisma.creditTransaction.create({
            data: {
              userId: employeeData.employeeUserId,
              organizationId,
              subscriptionId: subscription.id,
              type: CreditTransactionType.PERIOD_ALLOCATION,
              amount: this.PLAN_CREDITS[employeeData.plan],
              description: `Monthly credits allocated for sponsored ${employeeData.plan} plan`,
              metadata: {
                sponsorshipId: sponsorship.id,
                billingPeriod: subscription.currentPeriodStart,
              },
            },
          });
        }

        successful.push({
          id: sponsorship.id,
          subscriptionId: sponsorship.subscriptionId,
          sponsorUserId: sponsorship.sponsorUserId,
          sponsoredUserId: sponsorship.sponsoredUserId,
          organizationId: sponsorship.organizationId,
          plan: sponsorship.plan as SubscriptionPlan,
          monthlyCost: Number(sponsorship.monthlyCost),
          discountApplied: sponsorship.discountApplied
            ? Number(sponsorship.discountApplied)
            : undefined,
          originalPrice: Number(sponsorship.originalPrice),
          isActive: sponsorship.isActive,
          sponsoredAt: sponsorship.sponsoredAt,
          cancelledAt: sponsorship.cancelledAt || undefined,
          createdAt: sponsorship.createdAt,
          updatedAt: sponsorship.updatedAt,
          sponsoredUserName: employeeMember.user.name || '',
          sponsoredUserEmail: employeeMember.user.email,
          sponsorUserName: sponsorMember.user.name || '',
          organizationName: '', // Will be populated later
          subscriptionStatus: subscription.status as SubscriptionStatus,
          availableCredits:
            subscription.totalCredits +
            subscription.purchasedCredits -
            subscription.usedCredits,
          canUseAIFeatures: employeeData.plan === SubscriptionPlan.AI,
        });

        totalMonthlyCost += monthlyCost;
      } catch (error) {
        failed.push({
          employeeUserId: employeeData.employeeUserId,
          reason: `Error creating sponsorship: ${error.message}`,
          userName: 'Unknown',
          userEmail: 'Unknown',
        });
      }
    }

    return {
      successful,
      failed,
      summary: {
        totalRequested: createDto.employees.length,
        successfulCount: successful.length,
        failedCount: failed.length,
        totalMonthlyCost,
      },
    };
  }

  async getSponsoredEmployees(
    organizationId: string,
    sponsorUserId: string,
  ): Promise<SponsorshipWithUserInfoResponseDto[]> {
    // Verify sponsor has permission
    const sponsorMember = await this.prisma.member.findFirst({
      where: {
        userId: sponsorUserId,
        organizationId,
        role: 'OWNER',
      },
    });

    if (!sponsorMember) {
      throw new ForbiddenException(
        'Only organization owners can view sponsorships',
      );
    }

    const sponsorships =
      await this.prisma.employeeSubscriptionSponsorship.findMany({
        where: {
          sponsorUserId,
          organizationId,
          isActive: true,
        },
        include: {
          sponsoredUser: true,
          sponsorUser: true,
          organization: true,
          subscription: true,
        },
        orderBy: {
          sponsoredAt: 'desc',
        },
      });

    return sponsorships.map((sponsorship) => ({
      id: sponsorship.id,
      subscriptionId: sponsorship.subscriptionId,
      sponsorUserId: sponsorship.sponsorUserId,
      sponsoredUserId: sponsorship.sponsoredUserId,
      organizationId: sponsorship.organizationId,
      plan: sponsorship.plan as SubscriptionPlan,
      monthlyCost: Number(sponsorship.monthlyCost),
      discountApplied: sponsorship.discountApplied
        ? Number(sponsorship.discountApplied)
        : undefined,
      originalPrice: Number(sponsorship.originalPrice),
      isActive: sponsorship.isActive,
      sponsoredAt: sponsorship.sponsoredAt,
      cancelledAt: sponsorship.cancelledAt || undefined,
      createdAt: sponsorship.createdAt,
      updatedAt: sponsorship.updatedAt,
      sponsoredUserName: sponsorship.sponsoredUser.name || '',
      sponsoredUserEmail: sponsorship.sponsoredUser.email,
      sponsorUserName: sponsorship.sponsorUser.name || '',
      organizationName: sponsorship.organization.name,
      subscriptionStatus: sponsorship.subscription.status as SubscriptionStatus,
      availableCredits:
        sponsorship.subscription.totalCredits +
        sponsorship.subscription.purchasedCredits -
        sponsorship.subscription.usedCredits,
      canUseAIFeatures: sponsorship.plan === SubscriptionPlan.AI,
    }));
  }

  async cancelSponsorship(
    sponsorshipId: string,
    sponsorUserId: string,
  ): Promise<SponsorshipResponseDto> {
    const sponsorship =
      await this.prisma.employeeSubscriptionSponsorship.findUnique({
        where: { id: sponsorshipId },
        include: { subscription: true },
      });

    if (!sponsorship) {
      throw new NotFoundException('Sponsorship not found');
    }

    if (sponsorship.sponsorUserId !== sponsorUserId) {
      throw new ForbiddenException('You can only cancel your own sponsorships');
    }

    if (!sponsorship.isActive) {
      throw new BadRequestException('Sponsorship is already cancelled');
    }

    // Cancel sponsorship and subscription
    const updatedSponsorship =
      await this.prisma.employeeSubscriptionSponsorship.update({
        where: { id: sponsorshipId },
        data: {
          isActive: false,
          cancelledAt: new Date(),
        },
      });

    // Update subscription to trial or cancelled status
    await this.prisma.subscription.update({
      where: { id: sponsorship.subscriptionId },
      data: {
        plan: SubscriptionPlan.TRIAL,
        status: SubscriptionStatus.CANCELED,
        totalCredits: this.PLAN_CREDITS[SubscriptionPlan.TRIAL],
      },
    });

    return {
      id: updatedSponsorship.id,
      subscriptionId: updatedSponsorship.subscriptionId,
      sponsorUserId: updatedSponsorship.sponsorUserId,
      sponsoredUserId: updatedSponsorship.sponsoredUserId,
      organizationId: updatedSponsorship.organizationId,
      plan: updatedSponsorship.plan as SubscriptionPlan,
      monthlyCost: Number(updatedSponsorship.monthlyCost),
      discountApplied: updatedSponsorship.discountApplied
        ? Number(updatedSponsorship.discountApplied)
        : undefined,
      originalPrice: Number(updatedSponsorship.originalPrice),
      isActive: updatedSponsorship.isActive,
      sponsoredAt: updatedSponsorship.sponsoredAt,
      cancelledAt: updatedSponsorship.cancelledAt || undefined,
      createdAt: updatedSponsorship.createdAt,
      updatedAt: updatedSponsorship.updatedAt,
    };
  }

  async getSponsorshipBilling(
    organizationId: string,
    sponsorUserId: string,
  ): Promise<SponsorshipBillingSummaryResponseDto> {
    // Verify sponsor has permission
    const sponsorMember = await this.prisma.member.findFirst({
      where: {
        userId: sponsorUserId,
        organizationId,
        role: 'OWNER',
      },
      include: { organization: true },
    });

    if (!sponsorMember) {
      throw new ForbiddenException('Only organization owners can view billing');
    }

    const activeSponsorships =
      await this.prisma.employeeSubscriptionSponsorship.findMany({
        where: {
          sponsorUserId,
          organizationId,
          isActive: true,
        },
      });

    const totalMonthlyCost = activeSponsorships.reduce(
      (total, sponsorship) => total + Number(sponsorship.monthlyCost),
      0,
    );

    const totalDiscountSaved = activeSponsorships.reduce(
      (total, sponsorship) => {
        if (sponsorship.discountApplied) {
          return (
            total +
            (Number(sponsorship.originalPrice) -
              Number(sponsorship.monthlyCost))
          );
        }
        return total;
      },
      0,
    );

    // Get billing records (when implemented)
    const billingHistory: any[] = []; // TODO: Implement when SponsorshipBilling records are created

    return {
      totalMonthlyCost,
      activeSponsorship: activeSponsorships.length,
      nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Next month
      billingHistory,
      totalDiscountSaved,
      organizationName: sponsorMember.organization.name,
    };
  }
}
