import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Exclude } from 'class-transformer';
import { Campaign } from '../campaigns/campaign.entity';
import { Contribution } from '../contributions/contribution.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  @Exclude()
  password: string;

  @Column()
  name: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Campaign, campaign => campaign.creator)
  campaigns: Campaign[];

  @OneToMany(() => Contribution, contribution => contribution.user)
  contributions: Contribution[];
}