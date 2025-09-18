import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import {
  OrganizationEncryptionManager,
  UserSecretEncryptionManager,
} from '@/common/utilities';
import { OrganizationSecretsData } from '@/common/entities';

export interface UserOrganizationWithSecrets {
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  organizationLogo?: string;
  publicKey: string;
  privateKey: string;
}

export interface UserOrganizationPublic {
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  organizationLogo?: string;
  publicKey: string;
  encryptedData: string;
  createdAt: Date;
}

@Injectable()
export class UserSecretService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate or regenerate user secrets for all organizations the user is a member of
   * This replaces any existing user secrets
   */
  async generateUserSecrets(userId: string): Promise<{
    organizations: UserOrganizationWithSecrets[];
    message: string;
  }> {
    try {
      // Get all organizations the user is a member of
      const memberships = await this.prisma.member.findMany({
        where: { userId },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
              logo: true,
              consumerKey: true,
              consumerSecret: true,
              wooCommerceUrl: true,
            },
          },
        },
      });

      if (memberships.length === 0) {
        return {
          organizations: [],
          message: 'User is not a member of any organizations',
        };
      }

      const userOrganizations: UserOrganizationWithSecrets[] = [];

      // Process each organization
      for (const membership of memberships) {
        const org = membership.organization;

        // Skip organizations without complete data
        if (!org.consumerKey || !org.consumerSecret || !org.wooCommerceUrl) {
          console.warn(
            `Skipping organization ${org.id} - missing required fields`,
          );
          continue;
        }

        try {
          // Decrypt organization credentials using backend encryption
          const decryptedData = await this.decryptWithBackendSystem({
            consumerKey: org.consumerKey,
            consumerSecret: org.consumerSecret,
          });
          const organizationSecrets: OrganizationSecretsData = {
            consumerKey: decryptedData.consumerKey,
            consumerSecret: decryptedData.consumerSecret,
            wooCommerceUrl: org.wooCommerceUrl,
          };
          // Create new user-specific encrypted secret
          const userSecret =
            UserSecretEncryptionManager.createUserSecret(organizationSecrets);

          // Remove existing user secret if it exists, then create new one
          await this.prisma.userSecret.upsert({
            where: {
              userId_organizationId: {
                userId,
                organizationId: org.id,
              },
            },
            update: {
              publicKey: userSecret.publicKey,
              encryptedData: userSecret.encryptedData,
              updatedAt: new Date(),
            },
            create: {
              userId,
              organizationId: org.id,
              publicKey: userSecret.publicKey,
              encryptedData: userSecret.encryptedData,
            },
          });

          userOrganizations.push({
            organizationId: org.id,
            organizationName: org.name,
            organizationSlug: org.slug,
            organizationLogo: org.logo || undefined,
            publicKey: userSecret.publicKey,
            privateKey: userSecret.privateKey,
          });
        } catch (error) {
          console.error(`Failed to process organization ${org.id}:`, error);
        }
      }

      return {
        organizations: userOrganizations,
        message: `Generated secrets for ${userOrganizations.length} organizations`,
      };
    } catch (error) {
      console.error('Failed to generate user secrets:', error);
      throw new Error('Failed to generate user secrets');
    }
  }

  /**
   * Get user organizations with their public keys (for frontend)
   */
  async getUserOrganizations(userId: string): Promise<{
    organizations: UserOrganizationPublic[];
  }> {
    try {
      const userSecrets = await this.prisma.userSecret.findMany({
        where: { userId },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
              logo: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      const organizations: UserOrganizationPublic[] = userSecrets.map(
        (secret) => ({
          organizationId: secret.organizationId,
          organizationName: secret.organization.name,
          organizationSlug: secret.organization.slug,
          organizationLogo: secret.organization.logo || undefined,
          publicKey: secret.publicKey,
          encryptedData: secret.encryptedData,
          createdAt: secret.createdAt,
        }),
      );

      return { organizations };
    } catch (error) {
      console.error('Failed to get user organizations:', error);
      throw new Error('Failed to get user organizations');
    }
  }

  /**
   * Helper method to decrypt with backend encryption system
   */
  private async decryptWithBackendSystem(organization: {
    consumerKey: string;
    consumerSecret: string;
  }): Promise<{
    consumerKey: string;
    consumerSecret: string;
  }> {
    try {
      // Import the organization encryption manager

      return OrganizationEncryptionManager.decryptStoredOrganizationData({
        consumerKey: organization.consumerKey,
        consumerSecret: organization.consumerSecret,
      });
    } catch {
      // If backend decryption fails, throw error to indicate it's not encrypted format
      throw new Error('Not backend encrypted format');
    }
  }

  /**
   * Check if user has secrets for an organization
   */
  async hasUserSecret(
    userId: string,
    organizationId: string,
  ): Promise<boolean> {
    try {
      const userSecret = await this.prisma.userSecret.findUnique({
        where: {
          userId_organizationId: {
            userId,
            organizationId,
          },
        },
      });

      return !!userSecret;
    } catch (error) {
      console.error('Failed to check user secret:', error);
      return false;
    }
  }

  /**
   * Delete user secret for an organization
   */
  async deleteUserSecret(
    userId: string,
    organizationId: string,
  ): Promise<void> {
    try {
      await this.prisma.userSecret.delete({
        where: {
          userId_organizationId: {
            userId,
            organizationId,
          },
        },
      });
    } catch (error) {
      console.error('Failed to delete user secret:', error);
      throw new Error('Failed to delete user secret');
    }
  }
}
