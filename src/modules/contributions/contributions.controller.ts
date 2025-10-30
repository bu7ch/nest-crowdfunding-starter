import { 
    Controller, 
    Get, 
    Post, 
    Put, 
    Delete, 
    Body, 
    Param, 
    UseGuards, 
    Request,
    Query,
    ParseIntPipe,
    DefaultValuePipe,
    HttpStatus,
    HttpCode,
    ForbiddenException,
    BadRequestException
  } from '@nestjs/common';
  import { 
    ApiTags, 
    ApiOperation, 
    ApiResponse, 
    ApiBearerAuth, 
    ApiQuery,
    ApiParam 
  } from '@nestjs/swagger';
  import { ContributionsService } from './contributions.service';
  import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
  import { Contribution } from './contribution.entity';
  import { CreateContributionDto } from './dto/create-contribution.dto';
  import { UpdateContributionDto } from './dto/update-contribution.dto';
  
  @ApiTags('contributions')
  @Controller('contributions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  export class ContributionsController {
    constructor(private readonly contributionsService: ContributionsService) {}
  
    /**
     * Récupérer toutes les contributions (avec pagination)
     */
    @Get()
    @ApiOperation({ summary: 'Récupérer toutes les contributions (paginated)' })
    @ApiQuery({ name: 'page', required: false, type: Number, description: 'Numéro de page' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Nombre d\'éléments par page' })
    @ApiQuery({ name: 'status', required: false, type: String, description: 'Filtrer par statut' })
    @ApiResponse({ status: 200, description: 'Liste des contributions récupérée avec succès' })
    @ApiResponse({ status: 401, description: 'Non authentifié' })
    async findAll(
      @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
      @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number = 10,
      @Query('status') status?: string,
    ): Promise<{ 
      data: Contribution[]; 
      total: number; 
      page: number; 
      limit: number;
      totalPages: number;
    }> {
      // Limiter la pagination à 50 éléments maximum
      const take = Math.min(limit, 50);
      const skip = (page - 1) * take;
  
      const [contributions, total] = await this.contributionsService.findAllPaginated(
        page,
        take,
        ['user', 'campaign']
      );
      
      return {
        data: contributions,
        total,
        page,
        limit: take,
        totalPages: Math.ceil(total / take),
      };
    }
  
    /**
     * Récupérer une contribution spécifique par son ID
     */
    @Get(':id')
    @ApiOperation({ summary: 'Récupérer une contribution par son ID' })
    @ApiParam({ name: 'id', type: Number, description: 'ID de la contribution' })
    @ApiResponse({ status: 200, description: 'Contribution récupérée avec succès' })
    @ApiResponse({ status: 404, description: 'Contribution non trouvée' })
    @ApiResponse({ status: 401, description: 'Non authentifié' })
    async findOne(@Param('id', ParseIntPipe) id: number): Promise<Contribution> {
      return this.contributionsService.findOne(id, ['user', 'campaign']);
    }
  
    /**
     * Récupérer toutes les contributions d'une campagne spécifique
     */
    @Get('campaign/:campaignId')
    @ApiOperation({ summary: 'Récupérer les contributions d\'une campagne' })
    @ApiParam({ name: 'campaignId', type: Number, description: 'ID de la campagne' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'status', required: false, type: String })
    @ApiResponse({ status: 200, description: 'Contributions de la campagne récupérées avec succès' })
    @ApiResponse({ status: 404, description: 'Campagne non trouvée' })
    async findByCampaign(
      @Param('campaignId', ParseIntPipe) campaignId: number,
      @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
      @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number = 10,
      @Query('status') status?: string,
    ): Promise<{ 
      data: Contribution[]; 
      total: number; 
      page: number; 
      limit: number;
      totalPages: number;
    }> {
      const take = Math.min(limit, 50);
      const skip = (page - 1) * take;
  
      const [contributions, total] = await this.contributionsService.findByCampaignPaginated(
        campaignId,
        page,
        take,
        status
      );
      
      return {
        data: contributions,
        total,
        page,
        limit: take,
        totalPages: Math.ceil(total / take),
      };
    }
  
    /**
     * Récupérer toutes les contributions de l'utilisateur connecté
     */
    @Get('user/my-contributions')
    @ApiOperation({ summary: 'Récupérer mes contributions' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'status', required: false, type: String })
    @ApiResponse({ status: 200, description: 'Mes contributions récupérées avec succès' })
    async findMyContributions(
      @Request() req,
      @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
      @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number = 10,
      @Query('status') status?: string,
    ): Promise<{ 
      data: Contribution[]; 
      total: number; 
      page: number; 
      limit: number;
      totalPages: number;
    }> {
      const take = Math.min(limit, 50);
      const skip = (page - 1) * take;
  
      const [contributions, total] = await this.contributionsService.findByUserPaginated(
        req.user.id,
        page,
        take,
        status
      );
      
      return {
        data: contributions,
        total,
        page,
        limit: take,
        totalPages: Math.ceil(total / take),
      };
    }
  
    /**
     * Récupérer les contributions d'un utilisateur spécifique
     * (Accessible aux admins ou à l'utilisateur lui-même)
     */
    @Get('user/:userId')
    @ApiOperation({ summary: 'Récupérer les contributions d\'un utilisateur (Admin ou self)' })
    @ApiParam({ name: 'userId', type: Number, description: 'ID de l\'utilisateur' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiResponse({ status: 200, description: 'Contributions utilisateur récupérées avec succès' })
    @ApiResponse({ status: 403, description: 'Accès non autorisé' })
    async findByUser(
      @Param('userId', ParseIntPipe) userId: number,
      @Request() req,
      @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
      @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number = 10,
    ): Promise<{ 
      data: Contribution[]; 
      total: number; 
      page: number; 
      limit: number;
      totalPages: number;
    }> {
      // Vérifier que l'utilisateur peut accéder à ces données
      // Note: Vous devrez implémenter la logique isAdmin dans votre JWT
      if (req.user.id !== userId && !req.user.isAdmin) {
        throw new ForbiddenException('Vous ne pouvez accéder qu\'à vos propres contributions');
      }
  
      const take = Math.min(limit, 50);
      const skip = (page - 1) * take;
  
      const [contributions, total] = await this.contributionsService.findByUserPaginated(
        userId,
        page,
        take
      );
      
      return {
        data: contributions,
        total,
        page,
        limit: take,
        totalPages: Math.ceil(total / take),
      };
    }
  
    /**
     * Créer une nouvelle contribution
     * Note: En réalité, les contributions sont créées via le processus de paiement Stripe
     * Cette endpoint pourrait être utilisé pour des dons manuels ou des tests
     */
    @Post()
    @ApiOperation({ summary: 'Créer une nouvelle contribution' })
    @ApiResponse({ status: 201, description: 'Contribution créée avec succès' })
    @ApiResponse({ status: 400, description: 'Données invalides' })
    @ApiResponse({ status: 404, description: 'Campagne ou utilisateur non trouvé' })
    async create(
      @Body() createContributionDto: CreateContributionDto,
      @Request() req,
    ): Promise<Contribution> {
      // S'assurer que l'utilisateur ne peut créer que ses propres contributions
      const contributionData = {
        ...createContributionDto,
        userId: req.user.id, // Override avec l'ID de l'utilisateur connecté
      };
  
      return this.contributionsService.create(contributionData);
    }
  
    /**
     * Mettre à jour une contribution
     * (Principalement pour les administrateurs)
     */
    @Put(':id')
    @ApiOperation({ summary: 'Mettre à jour une contribution' })
    @ApiParam({ name: 'id', type: Number, description: 'ID de la contribution' })
    @ApiResponse({ status: 200, description: 'Contribution mise à jour avec succès' })
    @ApiResponse({ status: 404, description: 'Contribution non trouvée' })
    @ApiResponse({ status: 403, description: 'Non autorisé à modifier cette contribution' })
    async update(
      @Param('id', ParseIntPipe) id: number,
      @Body() updateContributionDto: UpdateContributionDto,
      @Request() req,
    ): Promise<Contribution> {
      // Vérifier les permissions
      const contribution = await this.contributionsService.findOne(id);
      
      // Seul l'admin ou le propriétaire de la contribution peut la modifier
      if (contribution.user.id !== req.user.id && !req.user.isAdmin) {
        throw new ForbiddenException('Vous ne pouvez modifier que vos propres contributions');
      }
  
      return this.contributionsService.update(id, updateContributionDto);
    }
  
    /**
     * Supprimer une contribution
     * (Principalement pour les administrateurs)
     */
    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Supprimer une contribution' })
    @ApiParam({ name: 'id', type: Number, description: 'ID de la contribution' })
    @ApiResponse({ status: 204, description: 'Contribution supprimée avec succès' })
    @ApiResponse({ status: 404, description: 'Contribution non trouvée' })
    @ApiResponse({ status: 403, description: 'Non autorisé à supprimer cette contribution' })
    async remove(
      @Param('id', ParseIntPipe) id: number,
      @Request() req,
    ): Promise<void> {
      // Vérifier les permissions
      const contribution = await this.contributionsService.findOne(id);
      
      // Seul l'admin ou le propriétaire de la contribution peut la supprimer
      if (contribution.user.id !== req.user.id && !req.user.isAdmin) {
        throw new ForbiddenException('Vous ne pouvez supprimer que vos propres contributions');
      }
  
      return this.contributionsService.remove(id);
    }
  
    /**
     * Statistiques des contributions pour une campagne
     */
    @Get('campaign/:campaignId/stats')
    @ApiOperation({ summary: 'Obtenir les statistiques d\'une campagne' })
    @ApiParam({ name: 'campaignId', type: Number, description: 'ID de la campagne' })
    @ApiResponse({ status: 200, description: 'Statistiques récupérées avec succès' })
    @ApiResponse({ status: 404, description: 'Campagne non trouvée' })
    async getCampaignStats(
      @Param('campaignId', ParseIntPipe) campaignId: number,
    ): Promise<{
      totalContributions: number;
      totalAmount: number;
      averageContribution: number;
      latestContributions: Contribution[];
      successRate: number;
    }> {
      return this.contributionsService.getCampaignStats(campaignId);
    }
  
    /**
     * Statistiques globales de la plateforme
     * (Accessible à tous les utilisateurs authentifiés)
     */
    @Get('platform/stats')
    @ApiOperation({ summary: 'Obtenir les statistiques globales de la plateforme' })
    @ApiResponse({ status: 200, description: 'Statistiques globales récupérées avec succès' })
    async getPlatformStats(): Promise<{
      totalContributions: number;
      totalAmount: number;
      averageContribution: number;
      contributionsToday: number;
      activeCampaignsCount: number;
    }> {
      return this.contributionsService.getPlatformStats();
    }
  
    /**
     * Dernières contributions (pour affichage en temps réel)
     */
    @Get('recent/latest')
    @ApiOperation({ summary: 'Obtenir les dernières contributions' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Nombre de contributions à récupérer' })
    @ApiResponse({ status: 200, description: 'Dernières contributions récupérées avec succès' })
    async getLatestContributions(
      @Query('limit', new DefaultValuePipe(5), ParseIntPipe) limit: number = 5,
    ): Promise<Contribution[]> {
      const take = Math.min(limit, 20); // Limiter à 20 maximum
      return this.contributionsService.findLatest(take);
    }
  
    /**
     * Vérifier si l'utilisateur a déjà contribué à une campagne
     */
    @Get('campaign/:campaignId/check')
    @ApiOperation({ summary: 'Vérifier si l\'utilisateur a contribué à une campagne' })
    @ApiParam({ name: 'campaignId', type: Number, description: 'ID de la campagne' })
    @ApiResponse({ status: 200, description: 'Vérification effectuée avec succès' })
    async checkUserContribution(
      @Param('campaignId', ParseIntPipe) campaignId: number,
      @Request() req,
    ): Promise<{ hasContributed: boolean; totalAmount?: number }> {
      const hasContributed = await this.contributionsService.hasUserContributedToCampaign(
        req.user.id,
        campaignId
      );
  
      let totalAmount = 0;
      if (hasContributed) {
        totalAmount = await this.contributionsService.getUserTotalContributionToCampaign(
          req.user.id,
          campaignId
        );
      }
  
      return {
        hasContributed,
        totalAmount: hasContributed ? totalAmount : undefined,
      };
    }
  
    /**
     * Top des contributeurs pour une campagne
     */
    @Get('campaign/:campaignId/top-contributors')
    @ApiOperation({ summary: 'Obtenir le top des contributeurs d\'une campagne' })
    @ApiParam({ name: 'campaignId', type: Number, description: 'ID de la campagne' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Nombre de contributeurs à afficher' })
    @ApiResponse({ status: 200, description: 'Top contributeurs récupérés avec succès' })
    async getTopContributors(
      @Param('campaignId', ParseIntPipe) campaignId: number,
      @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number = 10,
    ): Promise<{userId: number, totalAmount: number, user?: any}[]> {
      const take = Math.min(limit, 50);
      return this.contributionsService.getTopContributorsForCampaign(campaignId, take);
    }
  
    /**
     * Contributions par statut (pour administration)
     */
    @Get('status/:status')
    @ApiOperation({ summary: 'Récupérer les contributions par statut' })
    @ApiParam({ name: 'status', type: String, description: 'Statut des contributions' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiResponse({ status: 200, description: 'Contributions par statut récupérées avec succès' })
    @ApiResponse({ status: 403, description: 'Réservé aux administrateurs' })
    async findByStatus(
      @Param('status') status: string,
      @Request() req,
      @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
      @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number = 10,
    ): Promise<{ 
      data: Contribution[]; 
      total: number; 
      page: number; 
      limit: number;
      totalPages: number;
    }> {
      // Vérifier que l'utilisateur est admin
      if (!req.user.isAdmin) {
        throw new ForbiddenException('Cette fonctionnalité est réservée aux administrateurs');
      }
  
      const take = Math.min(limit, 50);
      const skip = (page - 1) * take;
  
      const [contributions, total] = await this.contributionsService.findByStatus(
        status,
        page,
        take
      );
      
      return {
        data: contributions,
        total,
        page,
        limit: take,
        totalPages: Math.ceil(total / take),
      };
    }
  }