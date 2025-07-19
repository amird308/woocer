import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponseDto } from '../types/dto.responce';

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiResponseDto<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponseDto<T>> {
    return next.handle().pipe(
      map((data) => {
        // If the response is already wrapped in ApiResponseDto, return as is
        if (data && typeof data === 'object' && 'success' in data) {
          return data;
        }
        
        // Otherwise, wrap the response
        return ApiResponseDto.success(data);
      }),
    );
  }
}