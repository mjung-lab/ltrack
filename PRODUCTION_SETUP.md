# L-TRACK Production Setup Guide

## 🐳 Docker Setup (Recommended)

### Prerequisites
1. Install Docker Desktop from https://www.docker.com/products/docker-desktop/
2. Ensure Docker is running

### 1. Start PostgreSQL & Redis
```bash
cd ltrack-complete
docker compose -f docker-compose.prod.yml up -d postgres redis
```

### 2. Verify containers are running
```bash
docker ps
```

### 3. Setup database schema
```bash
cd backend
cp .env.production .env
npm run db:push
npm run db:seed
```

### 4. Start production backend
```bash
npm run build
npm start
```

## 🍺 Alternative: Homebrew Setup (macOS)

### Install PostgreSQL and Redis
```bash
# Install Homebrew if not installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install PostgreSQL and Redis
brew install postgresql@15 redis

# Start services
brew services start postgresql@15
brew services start redis

# Create database
createdb ltrack_production
```

### Update environment variables
```bash
cd backend
cp .env.production .env
# Edit .env file if needed for local PostgreSQL
```

## 🚀 Production Deployment

### Backend Docker Build
```bash
cd backend
docker build -t ltrack-backend:latest .
docker run -d -p 3001:3001 --env-file .env.production ltrack-backend:latest
```

### Frontend Build
```bash
cd frontend
npm run build
# Deploy dist/ folder to your CDN/hosting
```

### Backend Manual Deployment
```bash
cd backend
npm run build:prod
npm run start:prod
```

## 📊 Database Migration
```bash
cd backend
npx prisma migrate deploy
```

## ⚙️ Environment Variables

The following production environment variables are configured:

- **Database**: PostgreSQL 15 with secure credentials
- **Cache**: Redis for session storage
- **Security**: Production JWT secrets (64+ chars)
- **Email**: SMTP configuration for notifications
- **Monitoring**: Slack webhook integration

## 🔧 Configuration Files Created

1. ✅ `docker-compose.prod.yml` - Production database containers
2. ✅ `backend/.env.production` - Production environment variables

## ⚠️ Security Notes

- Change default passwords in `.env.production`
- Use environment-specific JWT secrets
- Configure SSL certificates for HTTPS
- Set up firewall rules for production
- Enable database backups

## 📝 Next Steps

1. Install Docker Desktop or Homebrew + PostgreSQL
2. Run the containers: `docker compose -f docker-compose.prod.yml up -d`
3. Setup database schema: `npm run db:push`
4. Test production build: `npm run build && npm start`