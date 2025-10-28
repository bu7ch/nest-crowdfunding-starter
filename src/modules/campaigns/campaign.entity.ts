import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { Contribution } from '../contributions/contribution.entity';

@Entity()
export class Campaign {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column('decimal', { precision: 10, scale: 2 })
  goal: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  collected: number;

  @Column()
  deadline: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, user => user.campaigns)
  creator: User;

  @OneToMany(() => Contribution, contribution => contribution.campaign)
  contributions: Contribution[];

  // Virtual property for progress percentage
  get progress(): number {
    return (this.collected / this.goal) * 100;
  }

  // Virtual property to check if campaign is active
  get isActive(): boolean {
    return new Date() < new Date(this.deadline);
  }
}