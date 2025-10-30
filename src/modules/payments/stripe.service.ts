import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private stripe: Stripe;
  private readonly logger = new Logger(StripeService.name);

  constructor(private configService: ConfigService) {
    // Utilise la version d'API correcte pour la version du package Stripe
    this.stripe = new Stripe(this.configService.get('STRIPE_SECRET_KEY'), {
      apiVersion: '2023-08-16', // Version corrigée
    });
  }

  async createPaymentIntent(amount: number, campaignId: number, userId: number) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: 'eur',
        metadata: { 
          campaignId: campaignId.toString(),
          userId: userId.toString()
        },
      });

      return paymentIntent;
    } catch (error) {
      this.logger.error('Error creating payment intent', error);
      throw error;
    }
  }

  async constructEvent(payload: Buffer, signature: string) {
    const webhookSecret = this.configService.get('STRIPE_WEBHOOK_SECRET');
    
    return this.stripe.webhooks.constructEvent(
      payload,
      signature,
      webhookSecret
    );
  }
}