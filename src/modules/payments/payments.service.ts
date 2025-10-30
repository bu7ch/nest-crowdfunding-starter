import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { ContributionsService } from '../contributions/contributions.service';
import { CampaignsService } from '../campaigns/campaigns.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private stripeService: StripeService,
    private contributionsService: ContributionsService,
    private campaignsService: CampaignsService,
  ) {}

  /**
   * Créer un Payment Intent Stripe pour une contribution
   */
  async createPaymentIntent(amount: number, campaignId: number, userId: number) {
    // Validation basique
    if (amount <= 0) {
      throw new BadRequestException('Le montant doit être supérieur à 0');
    }

    try {
      // Créer le Payment Intent avec Stripe
      const paymentIntent = await this.stripeService.createPaymentIntent(
        amount,
        campaignId,
        userId
      );

      // Créer l'enregistrement de contribution
      const contribution = await this.contributionsService.create({
        amount,
        campaignId,
        userId,
        paymentIntentId: paymentIntent.id,
        status: 'pending',
      });

      this.logger.log(`Payment Intent créé: ${paymentIntent.id}`);

      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      };
    } catch (error) {
      this.logger.error(`Erreur payment: ${error.message}`);
      throw new BadRequestException(`Erreur de paiement: ${error.message}`);
    }
  }

  /**
   * Gérer les webhooks Stripe (version simplifiée)
   */
  async handleWebhook(payload: Buffer, signature: string) {
    try {
      const event = await this.stripeService.constructEvent(payload, signature);

      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSuccess(event.data.object);
          break;
        
        case 'payment_intent.payment_failed':
          await this.handlePaymentFailure(event.data.object);
          break;

        default:
          this.logger.log(`Événement non géré: ${event.type}`);
      }

      return { received: true };
    } catch (error) {
      this.logger.error(`Erreur webhook: ${error.message}`);
      throw new BadRequestException(`Webhook Error: ${error.message}`);
    }
  }

  /**
   * Gérer un paiement réussi
   */
  private async handlePaymentSuccess(paymentIntent: any) {
    const { id, amount, metadata } = paymentIntent;
    const amountInEuros = amount / 100;

    this.logger.log(`Paiement réussi: ${id}`);

    // Mettre à jour le statut de la contribution
    await this.contributionsService.updateStatus(id, 'succeeded');

    // Mettre à jour le montant collecté de la campagne
    await this.campaignsService.updateCollectedAmount(
      parseInt(metadata.campaignId),
      amountInEuros
    );
  }

  /**
   * Gérer un paiement échoué
   */
  private async handlePaymentFailure(paymentIntent: any) {
    await this.contributionsService.updateStatus(paymentIntent.id, 'failed');
    this.logger.warn(`Paiement échoué: ${paymentIntent.id}`);
  }
}