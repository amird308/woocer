import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateOrganizationDto, UpdateOrganizationDto } from './models/organization.request';
import { OrganizationResponseDto, OrganizationSummaryDto } from './models/organization.response';
import { PaginationDto } from '../../common/types/pagination.dto';
import { PaginationResponse } from '../../common/types/pagination.response';
import { generateUniqueSlug } from '../../common/utilities';

@Injectable()
export class OrganizationService {
  constructor(private prisma: PrismaService) {}

  async create(createOrganizationDto: CreateOrganizationDto, userId: string): Promise<OrganizationResponseDto> {
    const slug = generateUniqueSlug(createOrganizationDto.name);
    
    const organization = await this.prisma.organization.create({
      data: {
        ...createOrganizationDto,
        slug,
        members: {
          create: {
            userId,
            role: 'owner',
          },
        },
      },
    });

    return this.mapToOrganizationResponse(organization);
  }

  async findAll(paginationDto: PaginationDto): Promise<PaginationResponse<OrganizationSummaryDto>> {
    const { page = 0, take = 10 } = paginationDto;
    const skip = page * take;

    const [organizations, total] = await Promise.all([
      this.prisma.organization.findMany({
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.organization.count(),
    ]);

    const data = organizations.map(org => this.mapToOrganizationSummary(org));
    
    return {
      data,
      currentPage: page,
      totalPages: Math.ceil(total / take),
      total,
      take,
      offset: skip,
      hasNextPage: skip + take < total,
      hasPrevPage: page > 0,
    };
  }

  async findOne(id: string): Promise<OrganizationResponseDto> {
    const organization = await this.prisma.organization.findUnique({
      where: { id },
    });

    if (!organization) {
      throw new NotFoundException(`Organization with ID ${id} not found`);
    }

    return this.mapToOrganizationResponse(organization);
  }

  async update(id: string, updateOrganizationDto: UpdateOrganizationDto): Promise<OrganizationResponseDto> {
    const organization = await this.prisma.organization.update({
      where: { id },
      data: updateOrganizationDto,
    });

    return this.mapToOrganizationResponse(organization);
  }

  async remove(id: string): Promise<void> {
    await this.prisma.organization.delete({
      where: { id },
    });
  }



  private mapToOrganizationResponse(org: any): OrganizationResponseDto {
    return org;
  }

  private mapToOrganizationSummary(org: any): OrganizationSummaryDto {
    return {
      id: org.id,
      name: org.name,
      slug: org.slug,
      logo: org.logo,
    };
  }
}