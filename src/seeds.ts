import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './modules/users/user.entity';
import { Campaign } from './modules/campaigns/campaign.entity';

async function bootstrap() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'crowdfunding_user',
    password: 'crowdfunding_password',
    database: 'crowdfunding_db',
    entities: [__dirname + '/**/*.entity{.ts,.js}'],
  });

  await dataSource.initialize();

  const userRepository = dataSource.getRepository(User);
  const campaignRepository = dataSource.getRepository(Campaign);

  // Créer un utilisateur de test
  const hashedPassword = await bcrypt.hash('password123', 10);
  const user = userRepository.create({
    email: 'test@example.com',
    password: hashedPassword,
    name: 'Test User',
  });
  await userRepository.save(user);

  // Créer une campagne de test
  const campaign = campaignRepository.create({
    title: 'Aidez mon projet écologique',
    description: 'Un projet pour sauver la planète',
    goal: 5000,
    collected: 0,
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 jours
    creator: user,
  });
  await campaignRepository.save(campaign);

  console.log('Données de démonstration créées !');
  await dataSource.destroy();
}

bootstrap();