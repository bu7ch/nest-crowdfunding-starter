# 🚀 NestJS Crowdfunding Starter

[![NestJS](https://img.shields.io/badge/NestJS-10.0.0-e0234e?style=for-the-badge&logo=nestjs)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-100%25-3178c6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-13-336791?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![Stripe](https://img.shields.io/badge/Stripe-Payments-635bff?style=for-the-badge&logo=stripe)](https://stripe.com/)

Une application de crowdfunding complète construite avec **NestJS 10**, **PostgreSQL** et **Stripe**. Parfaite pour apprendre les bonnes pratiques de développement backend !

## ✨ Fonctionnalités

- 🔐 **Authentification JWT** avec bcrypt
- 🎯 **CRUD Campagnes** avec objectifs et dates limites
- 💳 **Paiements sécurisés** via Stripe (mode test)
- 📊 **Suivi des dons** et montants collectés
- 🐳 **Docker Ready** avec PostgreSQL
- 🧪 **Tests complets** avec Jest
- 📚 **Architecture modulaire** et maintenable

## 🏗️ Architecture

```
src/
├── modules/
│   ├── auth/          # Authentification JWT
│   ├── users/         # Gestion des utilisateurs
│   ├── campaigns/     # CRUD des campagnes
│   ├── contributions/ # Gestion des dons
│   └── payments/      # Intégration Stripe
├── common/            # Utilitaires partagés
└── seeds.ts          # Données de démonstration
```

## 🚀 Démarrage Rapide

### Pré-requis
- Node.js 16+
- Docker et Docker Compose
- Compte Stripe (pour les clés test)

### 📥 Installation

1. **Cloner le repository**
```bash
git clone https://github.com/ton-username/nest-crowdfunding-starter.git
cd nest-crowdfunding-starter
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configurer l'environnement**
```bash
cp .env.example .env
```
Éditez le fichier `.env` avec vos configurations :
```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=crowdfunding_user
DB_PASSWORD=crowdfunding_password
DB_NAME=crowdfunding_db

JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRES_IN=7d

STRIPE_SECRET_KEY=sk_test_your_stripe_test_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
```

4. **Lancer la base de données**
```bash
docker-compose up -d
```

5. **Lancer l'application**
```bash
# Mode développement
npm run start:dev

# Ou mode production
npm run build
npm run start:prod
```

L'application sera disponible sur `http://localhost:3000` 🎉

## 🧪 Tests

```bash
# Tests unitaires
npm run test

# Tests e2e
npm run test:e2e

# Couverture de tests
npm run test:cov
```

## 📚 API Examples

### 🔐 Authentification

**Inscription**
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "name": "John Doe"
  }'
```

**Connexion**
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### 🎯 Campagnes

**Créer une campagne** (Authentification requise)
```bash
curl -X POST http://localhost:3000/campaigns \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer VOTRE_JWT_TOKEN" \
  -d '{
    "title": "Aidez mon projet écologique",
    "description": "Un projet pour sauver la planète",
    "goal": 5000,
    "deadline": "2024-12-31"
  }'
```

**Lister les campagnes**
```bash
curl -X GET http://localhost:3000/campaigns
```

### 💳 Paiements

**Créer un don** (Authentification requise)
```bash
curl -X POST http://localhost:3000/payments/create-payment-intent \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer VOTRE_JWT_TOKEN" \
  -d '{
    "amount": 50,
    "campaignId": 1
  }'
```

## 🔧 Configuration Stripe

1. **Créez un compte Stripe** sur [stripe.com](https://stripe.com)
2. **Récupérez vos clés test** dans le Dashboard Développeur
3. **Configurez les webhooks** (optionnel) pour le mode production

**Clés test à utiliser :**
- `pk_test_...` pour la clé publique
- `sk_test_...` pour la clé secrète

## 🐛 Dépannage

**Problème de connexion à la base de données**
```bash
# Vérifier que PostgreSQL tourne
docker ps

# Redémarrer les containers
docker-compose down
docker-compose up -d
```

**Erreurs de dépendances**
```bash
# Supprimer node_modules et réinstaller
rm -rf node_modules package-lock.json
npm install
```

**Problèmes de permissions**
```bash
# Donner les permissions à Docker
sudo chown -R $USER:$USER .
```

## 📖 Bonnes Pratiques Implémentées

- ✅ **DRY** (Don't Repeat Yourself) - Services de base réutilisables
- ✅ **KISS** (Keep It Simple) - Architecture modulaire et claire
- ✅ **YAGNI** (You Ain't Gonna Need It) - Focus sur les features essentielles
- ✅ **Validation** des données avec class-validator
- ✅ **Gestion d'erreurs** centralisée
- ✅ **Sécurité** - mots de passe hashés, JWT sécurisé
- ✅ **Tests** unitaires et e2e

## 🤝 Contribuer

Les contributions sont les bienvenues ! 

1. **Forkez** le projet
2. **Créez une branche** pour votre feature (`git checkout -b feature/AmazingFeature`)
3. **Committez** vos changements (`git commit -m 'Add some AmazingFeature'`)
4. **Pushez** la branche (`git push origin feature/AmazingFeature`)
5. **Ouvrez une Pull Request**

### 📋 Guidelines de contribution

- Suivez les conventions de code existantes
- Ajoutez des tests pour les nouvelles fonctionnalités
- Mettez à jour la documentation si nécessaire
- Utilisez des messages de commit clairs

## 🎓 Apprentissage

Ce projet est parfait pour apprendre :

- **NestJS** et son architecture modulaire
- **TypeORM** et les relations entre entités
- **Stripe** et les paiements en ligne
- **JWT** et l'authentification sécurisée
- **Tests** avec Jest et Supertest
- **Docker** et la containerisation

## 📝 Licence

Ce projet est sous licence MIT - voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 🙏 Remerciements

- [NestJS](https://nestjs.com/) - Framework backend progressif
- [TypeORM](https://typeorm.io/) - ORM pour TypeScript
- [Stripe](https://stripe.com/) - API de paiements
- La communauté NestJS pour l'excellente documentation

---

**Développé avec ❤️ pour la communauté des développeurs juniors**

*Des questions ? Ouvrez une [issue](https://github.com/ton-username/nest-crowdfunding-starter/issues) ou rejoignez la discussion !*

<div align="center">

**⭐ N'oubliez pas de donner une étoile au repo si cela vous a aidé !**

</div>