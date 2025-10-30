import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { StripeService } from './stripe.service';
import { ContributionsModule } from '../contributions/contributions.module';
import { CampaignsModule } from '../campaigns/campaigns.module';

@Module({
  imports: [
    ConfigModule,
    ContributionsModule,
    CampaignsModule,
  ],
  providers: [PaymentsService, StripeService],
  controllers: [PaymentsController],
})
export class PaymentsModule {}