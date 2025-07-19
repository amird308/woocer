import { ApiProperty } from '@nestjs/swagger';
import { UserEntity } from '../../../common/entities';

export class UserResponseDto implements Omit<UserEntity, 'password'> {
  @ApiProperty({ description: 'User ID', example: 'uuid-string' })
  id: string;

  @ApiProperty({ description: 'User full name', example: 'John Doe', required: false })
  name?: string;

  @ApiProperty({ description: 'User email address', example: 'john@example.com' })
  email: string;

  @ApiProperty({ description: 'Email verification status', example: true })
  emailVerified: boolean;

  @ApiProperty({ description: 'User profile image URL', required: false })
  image?: string;

  @ApiProperty({ description: 'User creation date', example: '2024-01-01T00:00:00Z' })
  createdAt: Date;

  @ApiProperty({ description: 'User last update date', example: '2024-01-01T00:00:00Z' })
  updatedAt: Date;
}

export class UserSummaryDto implements Pick<UserEntity, 'id' | 'name' | 'email' | 'image'> {
  @ApiProperty({ description: 'User ID', example: 'uuid-string' })
  id: string;

  @ApiProperty({ description: 'User full name', example: 'John Doe', required: false })
  name?: string;

  @ApiProperty({ description: 'User email address', example: 'john@example.com' })
  email: string;

  @ApiProperty({ description: 'User profile image URL', required: false })
  image?: string;
}