import { ApiProperty } from '@nestjs/swagger';

export class ApiResponseDto<T> {
  @ApiProperty({ description: 'Success status', example: true })
  success: boolean;

  @ApiProperty({ description: 'Response message', example: 'Operation completed successfully' })
  message: string;

  @ApiProperty({ description: 'Response data' })
  data?: T;

  @ApiProperty({ description: 'Error details', required: false })
  error?: any;

  constructor(success: boolean, message: string, data?: T, error?: any) {
    this.success = success;
    this.message = message;
    this.data = data;
    this.error = error;
  }

  static success<T>(data: T, message = 'Success'): ApiResponseDto<T> {
    return new ApiResponseDto(true, message, data);
  }

  static error(message: string, error?: any): ApiResponseDto<null> {
    return new ApiResponseDto(false, message, null, error);
  }
}