import { IsString, IsNumber, IsDate, Min, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCampaignDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  @Min(1)
  goal: number;

  @IsDate()
  @Type(() => Date)
  deadline: Date;
}