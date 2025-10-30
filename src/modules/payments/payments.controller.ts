import { 
    Controller, 
    Post, 
    Body, 
    UseGuards, 
    Request, 
    HttpCode, 
    HttpStatus,
    Headers,
    Req
  } from '@nestjs/common';
  import { PaymentsService } from './payments.service';
  import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
  
  @Controller('payments')
  export class PaymentsController {
    constructor(private readonly paymentsService: PaymentsService) {}
  
    /**
     * Créer un Payment Intent pour une nouvelle contribution
     */
    @Post('create-payment-intent')
    @UseGuards(JwtAuthGuard)
    async createPaymentIntent(
      @Body() body: { amount: number; campaignId: number },
      @Request() req,
    ) {
      return this.paymentsService.createPaymentIntent(
        body.amount,
        body.campaignId,
        req.user.id
      );
    }
  
    /**
     * Webhook Stripe (version basique)
     */
    @Post('webhook')
    @HttpCode(HttpStatus.OK)
    async handleWebhook(
      @Headers('stripe-signature') signature: string,
      @Req() request: any,
    ) {
      // Pour le starter, on utilise le body JSON simple
      // En production, il faudra utiliser le body brut
      return this.paymentsService.handleWebhook(
        Buffer.from(JSON.stringify(request.body)),
        signature
      );
    }
  }