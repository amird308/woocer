import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
import { UserEntity } from '../../../common/entities';

export class CreateUserDto implements Pick<UserEntity, 'name' | 'email' | 'password'> {
  @ApiProperty({ description: 'User full name', example: 'John Doe', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: 'User email address', example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'User password', example: 'password123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password?: string;
}

export class UpdateUserDto implements Partial<Pick<UserEntity, 'name' | 'image'>> {
  @ApiProperty({ description: 'User full name', example: 'John Doe', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: 'User profile image URL', required: false })
  @IsOptional()
  @IsString()
  image?: string;
}