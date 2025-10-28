import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { Campaign } from '../campaigns/campaign.entity';

@Entity()
export class Contribution {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column()
  paymentIntentId: string;

  @Column({ default: 'pending' })
  status: string; // pending, succeeded, failed

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, user => user.contributions)
  user: User;

  @ManyToOne(() => Campaign, campaign => campaign.contributions)
  campaign: Campaign;
}