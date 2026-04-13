import {
  IsString,
  IsEmail,
  IsOptional,
  MinLength,
  MaxLength,
  Matches,
  IsNumber,
  Min,
  Max,
} from 'class-validator';

/**
 * DTO for /siriscloud/auth/login
 */
export class LoginDto {
  @IsString()
  @IsEmail({}, { message: 'Invalid email format' })
  @MaxLength(255)
  email: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @MaxLength(128)
  password: string;
}

/**
 * DTO for /siriscloud/auth/register
 */
export class RegisterDto {
  @IsString()
  @IsEmail({}, { message: 'Invalid email format' })
  @MaxLength(255)
  email: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @MaxLength(128)
  password: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;
}

/**
 * DTO for /siriscloud/auth/validate
 */
export class ValidateTokenDto {
  @IsString()
  @MinLength(1, { message: 'Token cannot be empty' })
  @MaxLength(2048)
  token: string;
}

/**
 * DTO for /openclaw/launch
 */
export class LaunchDto {
  @IsOptional()
  @IsString()
  @Matches(/^[a-zA-Z0-9._\-\/]+$/, {
    message: 'Model name contains invalid characters. Only alphanumeric, hyphens, underscores, dots, and slashes are allowed.',
  })
  @MaxLength(100)
  model?: string;
}

/**
 * DTO for /openclaw/logs query
 */
export class LogsQueryDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1000, { message: 'Tail cannot exceed 1000 lines' })
  tail?: number = 50;
}