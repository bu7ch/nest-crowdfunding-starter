import { IsNumber, IsPositive, IsString } from 'class-validator';

export class CreateContributionDto {
  @IsNumber()
  @IsPositive()
  amount: number;

  @IsNumber()
  campaignId: number;

  @IsNumber()
  userId: number;

  @IsString()
  paymentIntentId: string;

  @IsString()
  status: string;
}