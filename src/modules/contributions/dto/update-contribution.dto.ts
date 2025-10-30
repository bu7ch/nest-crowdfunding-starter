import { PartialType } from '@nestjs/mapped-types';
import { CreateContributionDto } from './create-contribution.dto';
import { 
  IsString, 
  IsOptional, 
  IsEnum, 
  IsNumber, 
  IsPositive, 
  Min 
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateContributionDto extends PartialType(CreateContributionDto) {
  @ApiPropertyOptional({
    description: 'Statut de la contribution',
    enum: ['pending', 'succeeded', 'failed', 'refunded'],
    example: 'succeeded'
  })
  @IsString()
  @IsOptional()
  @IsEnum(['pending', 'succeeded', 'failed', 'refunded'])
  status?: string;

  @ApiPropertyOptional({
    description: 'Montant de la contribution',
    minimum: 1,
    example: 50.00
  })
  @IsNumber()
  @IsPositive()
  @Min(1)
  @IsOptional()
  amount?: number;

  @ApiPropertyOptional({
    description: 'ID de l\'intent de paiement Stripe',
    example: 'pi_1A2b3C4d5E6f7G8h9I0j'
  })
  @IsString()
  @IsOptional()
  paymentIntentId?: string;

  @ApiPropertyOptional({
    description: 'ID de la campagne',
    example: 1
  })
  @IsNumber()
  @IsOptional()
  campaignId?: number;

  @ApiPropertyOptional({
    description: 'ID de l\'utilisateur',
    example: 1
  })
  @IsNumber()
  @IsOptional()
  userId?: number;
}