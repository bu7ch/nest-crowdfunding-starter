import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThan, LessThanOrEqual, In } from 'typeorm';
import { Contribution } from './contribution.entity';
import { CreateContributionDto } from './dto/create-contribution.dto';
import { UpdateContributionDto } from './dto/update-contribution.dto';
import { CampaignsService } from '../campaigns/campaigns.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class ContributionsService {
  private readonly logger = new Logger(ContributionsService.name);

  constructor(
    @InjectRepository(Contribution)
    private contributionsRepository: Repository<Contribution>,
    private campaignsService: CampaignsService,
    private usersService: UsersService,
  ) {}

  /**
   * Créer une nouvelle contribution
   */
  async create(createContributionDto: CreateContributionDto): Promise<Contribution> {
    const { userId, campaignId, amount } = createContributionDto;

    // Vérifier que l'utilisateur existe
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Vérifier que la campagne existe
    const campaign = await this.campaignsService.findOne(campaignId);
    if (!campaign) {
      throw new NotFoundException(`Campaign with ID ${campaignId} not found`);
    }

    // Vérifier que la campagne est encore active
    if (!campaign.isActive) {
      throw new BadRequestException('Cannot contribute to an expired campaign');
    }

    // Vérifier que le montant est positif
    if (amount <= 0) {
      throw new BadRequestException('Contribution amount must be positive');
    }

    try {
      const contribution = this.contributionsRepository.create({
        ...createContributionDto,
        user,
        campaign,
      });

      const savedContribution = await this.contributionsRepository.save(contribution);
      
      this.logger.log(`New contribution created: ${savedContribution.id} for campaign ${campaignId}`);
      
      return savedContribution;
    } catch (error) {
      this.logger.error(`Failed to create contribution: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Trouver toutes les contributions avec pagination
   */
  async findAllPaginated(
    page: number = 1,
    limit: number = 10,
    relations: string[] = ['user', 'campaign']
  ): Promise<[Contribution[], number]> {
    const skip = (page - 1) * limit;

    try {
      const [contributions, total] = await this.contributionsRepository.findAndCount({
        relations,
        order: { createdAt: 'DESC' },
        skip,
        take: limit,
      });
      
      return [contributions, total];
    } catch (error) {
      this.logger.error(`Failed to find contributions: ${error.message}`);
      throw error;
    }
  }

  /**
   * Trouver une contribution par son ID
   */
  async findOne(id: number, relations: string[] = ['user', 'campaign']): Promise<Contribution> {
    try {
      const contribution = await this.contributionsRepository.findOne({
        where: { id },
        relations,
      });

      if (!contribution) {
        throw new NotFoundException(`Contribution with ID ${id} not found`);
      }

      return contribution;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to find contribution ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Trouver les contributions par campagne avec pagination
   */
  async findByCampaignPaginated(
    campaignId: number,
    page: number = 1,
    limit: number = 10,
    status?: string
  ): Promise<[Contribution[], number]> {
    const skip = (page - 1) * limit;
    
    const where: any = { campaign: { id: campaignId } };
    if (status) {
      where.status = status;
    }

    try {
      const [contributions, total] = await this.contributionsRepository.findAndCount({
        where,
        relations: ['user'],
        order: { createdAt: 'DESC' },
        skip,
        take: limit,
      });

      return [contributions, total];
    } catch (error) {
      this.logger.error(`Failed to find contributions for campaign ${campaignId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Trouver les contributions par utilisateur avec pagination
   */
  async findByUserPaginated(
    userId: number,
    page: number = 1,
    limit: number = 10,
    status?: string
  ): Promise<[Contribution[], number]> {
    const skip = (page - 1) * limit;
    
    const where: any = { user: { id: userId } };
    if (status) {
      where.status = status;
    }

    try {
      const [contributions, total] = await this.contributionsRepository.findAndCount({
        where,
        relations: ['campaign'],
        order: { createdAt: 'DESC' },
        skip,
        take: limit,
      });

      return [contributions, total];
    } catch (error) {
      this.logger.error(`Failed to find contributions for user ${userId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Mettre à jour le statut d'une contribution
   */
  async updateStatus(paymentIntentId: string, status: string): Promise<void> {
    try {
      const result = await this.contributionsRepository.update(
        { paymentIntentId },
        { status }
      );

      if (result.affected === 0) {
        this.logger.warn(`No contribution found with paymentIntentId: ${paymentIntentId}`);
        return;
      }

      this.logger.log(`Updated contribution status to ${status} for paymentIntent: ${paymentIntentId}`);
    } catch (error) {
      this.logger.error(`Failed to update contribution status: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Mettre à jour une contribution
   */
  async update(id: number, updateContributionDto: UpdateContributionDto): Promise<Contribution> {
    try {
      const contribution = await this.findOne(id);
      
      await this.contributionsRepository.update(id, updateContributionDto);
      
      // Retourner la contribution mise à jour
      return this.findOne(id);
    } catch (error) {
      this.logger.error(`Failed to update contribution ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Supprimer une contribution
   */
  async remove(id: number): Promise<void> {
    try {
      const contribution = await this.findOne(id);
      
      const result = await this.contributionsRepository.delete(id);
      
      if (result.affected === 0) {
        throw new NotFoundException(`Contribution with ID ${id} not found`);
      }

      this.logger.log(`Contribution ${id} deleted`);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to delete contribution ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtenir les statistiques d'une campagne
   */
  async getCampaignStats(campaignId: number): Promise<{
    totalContributions: number;
    totalAmount: number;
    averageContribution: number;
    latestContributions: Contribution[];
    successRate: number;
  }> {
    try {
      const contributions = await this.contributionsRepository.find({
        where: { 
          campaign: { id: campaignId },
          status: In(['succeeded', 'pending', 'failed']) // Inclure tous les statuts pour les stats
        },
        relations: ['user'],
        order: { createdAt: 'DESC' },
      });

      const successfulContributions = contributions.filter(c => c.status === 'succeeded');
      const totalContributions = successfulContributions.length;
      const totalAmount = successfulContributions.reduce(
        (sum, contrib) => sum + parseFloat(contrib.amount.toString()), 
        0
      );
      const averageContribution = totalContributions > 0 ? totalAmount / totalContributions : 0;
      const latestContributions = successfulContributions.slice(0, 5);
      const successRate = contributions.length > 0 
        ? (successfulContributions.length / contributions.length) * 100 
        : 0;

      return {
        totalContributions,
        totalAmount,
        averageContribution,
        latestContributions,
        successRate,
      };
    } catch (error) {
      this.logger.error(`Failed to get stats for campaign ${campaignId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtenir les dernières contributions
   */
  async findLatest(limit: number = 5, status: string = 'succeeded'): Promise<Contribution[]> {
    try {
      return await this.contributionsRepository.find({
        where: { status },
        relations: ['user', 'campaign'],
        order: { createdAt: 'DESC' },
        take: limit,
      });
    } catch (error) {
      this.logger.error(`Failed to find latest contributions: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtenir les statistiques globales de la plateforme
   */
  async getPlatformStats(): Promise<{
    totalContributions: number;
    totalAmount: number;
    averageContribution: number;
    contributionsToday: number;
    activeCampaignsCount: number;
  }> {
    try {
      // Total des contributions réussies
      const successfulContributions = await this.contributionsRepository.find({
        where: { status: 'succeeded' }
      });

      const totalContributions = successfulContributions.length;
      const totalAmount = successfulContributions.reduce(
        (sum, contrib) => sum + parseFloat(contrib.amount.toString()), 
        0
      );
      const averageContribution = totalContributions > 0 ? totalAmount / totalContributions : 0;

      // Contributions aujourd'hui
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const contributionsToday = await this.contributionsRepository.count({
        where: {
          status: 'succeeded',
          createdAt: Between(today, tomorrow)
        }
      });

      // Compter les campagnes actives (via le service campaigns)
      // Note: Cette méthode devrait être implémentée dans CampaignsService
      // Pour l'instant, nous retournons 0
      const activeCampaignsCount = 0;

      return {
        totalContributions,
        totalAmount,
        averageContribution,
        contributionsToday,
        activeCampaignsCount,
      };
    } catch (error) {
      this.logger.error(`Failed to get platform stats: ${error.message}`);
      throw error;
    }
  }

  /**
   * Trouver les contributions par statut
   */
  async findByStatus(status: string, page: number = 1, limit: number = 10): Promise<[Contribution[], number]> {
    const skip = (page - 1) * limit;

    try {
      const [contributions, total] = await this.contributionsRepository.findAndCount({
        where: { status },
        relations: ['user', 'campaign'],
        order: { createdAt: 'DESC' },
        skip,
        take: limit,
      });

      return [contributions, total];
    } catch (error) {
      this.logger.error(`Failed to find contributions with status ${status}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Vérifier si un utilisateur a déjà contribué à une campagne
   */
  async hasUserContributedToCampaign(userId: number, campaignId: number): Promise<boolean> {
    try {
      const count = await this.contributionsRepository.count({
        where: {
          user: { id: userId },
          campaign: { id: campaignId },
          status: 'succeeded'
        }
      });

      return count > 0;
    } catch (error) {
      this.logger.error(`Failed to check user contribution: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtenir le montant total contribué par un utilisateur à une campagne
   */
  async getUserTotalContributionToCampaign(userId: number, campaignId: number): Promise<number> {
    try {
      const contributions = await this.contributionsRepository.find({
        where: {
          user: { id: userId },
          campaign: { id: campaignId },
          status: 'succeeded'
        }
      });

      return contributions.reduce(
        (sum, contrib) => sum + parseFloat(contrib.amount.toString()), 
        0
      );
    } catch (error) {
      this.logger.error(`Failed to get user total contribution: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtenir le top des contributeurs pour une campagne
   */
  async getTopContributorsForCampaign(campaignId: number, limit: number = 10): Promise<{userId: number, totalAmount: number, user?: any}[]> {
    try {
      // Cette requête nécessite une query plus complexe avec GROUP BY
      const result = await this.contributionsRepository
        .createQueryBuilder('contribution')
        .select('contribution.userId', 'userId')
        .addSelect('SUM(contribution.amount)', 'totalAmount')
        .where('contribution.campaignId = :campaignId', { campaignId })
        .andWhere('contribution.status = :status', { status: 'succeeded' })
        .groupBy('contribution.userId')
        .orderBy('totalAmount', 'DESC')
        .limit(limit)
        .getRawMany();

      // Enrichir avec les informations utilisateur
      const enrichedResult = await Promise.all(
        result.map(async (item) => {
          try {
            const user = await this.usersService.findById(item.userId);
            return {
              userId: item.userId,
              totalAmount: parseFloat(item.totalAmount),
              user: {
                id: user.id,
                name: user.name,
                email: user.email
              }
            };
          } catch (error) {
            return {
              userId: item.userId,
              totalAmount: parseFloat(item.totalAmount),
              user: null
            };
          }
        })
      );

      return enrichedResult;
    } catch (error) {
      this.logger.error(`Failed to get top contributors for campaign ${campaignId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Nettoyer les contributions anciennes ou en échec
   * (Pour les jobs cron/maintenance)
   */
  async cleanupOldFailedContributions(daysOld: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await this.contributionsRepository
        .createQueryBuilder()
        .delete()
        .where('status = :status', { status: 'failed' })
        .andWhere('createdAt < :cutoffDate', { cutoffDate })
        .execute();

      this.logger.log(`Cleaned up ${result.affected} old failed contributions`);
      return result.affected || 0;
    } catch (error) {
      this.logger.error(`Failed to cleanup old contributions: ${error.message}`);
      throw error;
    }
  }
}