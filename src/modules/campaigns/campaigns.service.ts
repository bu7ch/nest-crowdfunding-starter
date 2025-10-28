import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Campaign } from './campaign.entity';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { UsersService } from '../users/users.service';

@Injectable()
export class CampaignsService {
  constructor(
    @InjectRepository(Campaign)
    private campaignsRepository: Repository<Campaign>,
    private usersService: UsersService,
  ) {}

  async findAll(): Promise<Campaign[]> {
    return this.campaignsRepository.find({
      relations: ['creator', 'contributions'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Campaign> {
    const campaign = await this.campaignsRepository.findOne({
      where: { id },
      relations: ['creator', 'contributions', 'contributions.user'],
    });
    
    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }
    
    return campaign;
  }

  async create(createCampaignDto: CreateCampaignDto, userId: number): Promise<Campaign> {
    const user = await this.usersService.findById(userId);
    const campaign = this.campaignsRepository.create({
      ...createCampaignDto,
      creator: user,
    });
    
    return this.campaignsRepository.save(campaign);
  }

  async update(id: number, updateCampaignDto: UpdateCampaignDto, userId: number): Promise<Campaign> {
    const campaign = await this.findOne(id);
    
    if (campaign.creator.id !== userId) {
      throw new ForbiddenException('You can only update your own campaigns');
    }
    
    await this.campaignsRepository.update(id, updateCampaignDto);
    return this.findOne(id);
  }

  async remove(id: number, userId: number): Promise<void> {
    const campaign = await this.findOne(id);
    
    if (campaign.creator.id !== userId) {
      throw new ForbiddenException('You can only delete your own campaigns');
    }
    
    await this.campaignsRepository.delete(id);
  }

  async updateCollectedAmount(campaignId: number, amount: number): Promise<void> {
    await this.campaignsRepository
      .createQueryBuilder()
      .update(Campaign)
      .set({ 
        collected: () => `collected + ${amount}` 
      })
      .where('id = :id', { id: campaignId })
      .execute();
  }
}