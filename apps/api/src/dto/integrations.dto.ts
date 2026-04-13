import {
  IsString,
  IsOptional,
  IsObject,
  IsArray,
  MaxLength,
  IsUUID,
} from 'class-validator';

/**
 * DTO for creating integrations
 */
export class CreateIntegrationDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsString()
  @MaxLength(50)
  type: string;

  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>;
}

/**
 * DTO for integration ID param
 */
export class IntegrationIdParam {
  @IsString()
  @IsUUID('4', { message: 'Invalid integration ID format' })
  id: string;
}

/**
 * DTO for pagination query
 */
export class PaginationQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  cursor?: string;

  @IsOptional()
  limit?: number = 20;
}