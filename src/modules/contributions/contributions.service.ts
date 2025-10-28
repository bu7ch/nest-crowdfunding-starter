import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contribution } from './contribution.entity';
import { CreateContributionDto } from './dto/create-contribution.dto';
import { CampaignsService } from '../campaigns/campaigns.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class ContributionsService {
  constructor(
    @InjectRepository(Contribution)
    private contributionsRepository: Repository<Contribution>,
    private campaignsService: CampaignsService,
    private usersService: UsersService,
  ) {}

  async create(createContributionDto: CreateContributionDto): Promise<Contribution> {
    const user = await this.usersService.findById(createContributionDto.userId);
    const campaign = await this.campaignsService.findOne(createContributionDto.campaignId);

    const contribution = this.contributionsRepository.create({
      ...createContributionDto,
      user,
      campaign,
    });

    return this.contributionsRepository.save(contribution);
  }

  async findByCampaign(campaignId: number): Promise<Contribution[]> {
    return this.contributionsRepository.find({
      where: { campaign: { id: campaignId } },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByUser(userId: number): Promise<Contribution[]> {
    return this.contributionsRepository.find({
      where: { user: { id: userId } },
      relations: ['campaign'],
      order: { createdAt: 'DESC' },
    });
  }

  async updateStatus(paymentIntentId: string, status: string): Promise<void> {
    await this.contributionsRepository.update(
      { paymentIntentId },
      { status }
    );
  }
}