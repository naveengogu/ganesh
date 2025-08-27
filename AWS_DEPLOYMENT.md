# AWS EC2 Deployment Guide

## Prerequisites
- AWS EC2 instance (Ubuntu 20.04+ recommended)
- Docker and Docker Compose installed
- Security groups configured

## 1. EC2 Instance Setup

### Launch EC2 Instance
```bash
# Ubuntu 20.04 LTS (t3.medium or larger recommended)
# Storage: At least 20GB for OS + application
```

### Security Groups
Configure these ports:
- **Port 22**: SSH (your IP)
- **Port 80**: HTTP (0.0.0.0/0)
- **Port 443**: HTTPS (0.0.0.0/0) - Optional for SSL
- **Port 3000**: Backend API (0.0.0.0/0) - Optional, for direct API access

## 2. Install Docker and Docker Compose

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Logout and login again for group changes
exit
# SSH back into your instance
```

## 3. Database Persistence Options

### Option A: Local Docker Volume (Simple)
```bash
# Uses local storage on EC2 instance
# Data persists as long as instance exists
docker-compose -f docker-compose.prod.yml up -d
```

### Option B: AWS EBS Volume (Recommended for Production)
```bash
# 1. Create EBS volume
aws ec2 create-volume \
  --size 20 \
  --region us-east-1 \
  --availability-zone us-east-1a \
  --volume-type gp3 \
  --tag-specifications 'ResourceType=volume,Tags=[{Key=Name,Value=velampata-db}]'

# 2. Attach volume to your EC2 instance
aws ec2 attach-volume \
  --volume-id vol-xxxxxxxxx \
  --instance-id i-xxxxxxxxx \
  --device /dev/sdf

# 3. Format and mount the volume
sudo mkfs -t ext4 /dev/xvdf
sudo mkdir /mnt/velampata-db
sudo mount /dev/xvdf /mnt/velampata-db
sudo chown 999:999 /mnt/velampata-db  # PostgreSQL user

# 4. Add to fstab for auto-mount
echo "/dev/xvdf /mnt/velampata-db ext4 defaults,nofail 0 2" | sudo tee -a /etc/fstab
```

### Option C: AWS RDS (Most Reliable)
```bash
# Create RDS PostgreSQL instance
aws rds create-db-instance \
  --db-instance-identifier velampata-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username postgres \
  --master-user-password your-secure-password \
  --allocated-storage 20 \
  --vpc-security-group-ids sg-xxxxxxxxx

# Update docker-compose.prod.yml to use RDS
# Replace PGHOST with RDS endpoint
```

## 4. Deploy Application

### Clone and Deploy
```bash
# Clone your repository
git clone <your-repo-url>
cd velampata

# For EBS volume option, update docker-compose.prod.yml:
volumes:
  postgres_data:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: /mnt/velampata-db

# Deploy
docker-compose -f docker-compose.prod.yml up -d --build
```

## 5. Environment Variables (Production)

### Create .env file
```bash
# Create production environment file
cat > .env << EOF
# Database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your-secure-password
POSTGRES_DB=velampata

# Backend
JWT_SECRET=your-super-secure-jwt-secret-key
NODE_ENV=production

# Frontend
VITE_API_BASE=/api
EOF
```

### Update docker-compose.prod.yml to use .env
```yaml
services:
  db:
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
  
  backend:
    environment:
      PGPASSWORD: ${POSTGRES_PASSWORD}
      JWT_SECRET: ${JWT_SECRET}
      NODE_ENV: ${NODE_ENV}
```

## 6. SSL/HTTPS Setup (Optional)

### Using Let's Encrypt with Nginx
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com

# Update nginx.conf to handle SSL
```

## 7. Monitoring and Maintenance

### View Logs
```bash
# All services
docker-compose -f docker-compose.prod.yml logs

# Specific service
docker-compose -f docker-compose.prod.yml logs backend
docker-compose -f docker-compose.prod.yml logs db
```

### Backup Database
```bash
# Create backup script
cat > backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker-compose -f docker-compose.prod.yml exec -T db pg_dump -U postgres velampata > backup_$DATE.sql
aws s3 cp backup_$DATE.sql s3://your-backup-bucket/
rm backup_$DATE.sql
EOF

chmod +x backup.sh

# Add to crontab for daily backups
echo "0 2 * * * /path/to/backup.sh" | crontab -
```

### Update Application
```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --build
```

## 8. Troubleshooting

### Common Issues
1. **Database Connection Failed**
   ```bash
   # Check if database is running
   docker-compose -f docker-compose.prod.yml ps
   
   # Check database logs
   docker-compose -f docker-compose.prod.yml logs db
   ```

2. **Volume Mount Issues**
   ```bash
   # Check volume permissions
   ls -la /mnt/velampata-db
   
   # Fix permissions if needed
   sudo chown -R 999:999 /mnt/velampata-db
   ```

3. **Port Already in Use**
   ```bash
   # Check what's using port 80
   sudo netstat -tlnp | grep :80
   
   # Stop conflicting service
   sudo systemctl stop apache2  # if Apache is running
   ```

## 9. Security Best Practices

### Update Default Credentials
```bash
# Change default admin password in database
docker-compose -f docker-compose.prod.yml exec db psql -U postgres -d velampata
```

```sql
-- In PostgreSQL
UPDATE admins SET password_hash = crypt('new-secure-password', gen_salt('bf')) WHERE username = 'admin';
```

### Firewall Configuration
```bash
# Configure UFW firewall
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

### Regular Updates
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Docker images
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

## 10. Performance Optimization

### For High Traffic
```bash
# Increase PostgreSQL connections
# Add to docker-compose.prod.yml db service:
environment:
  POSTGRES_MAX_CONNECTIONS: 200

# Add Nginx caching
# Update nginx.conf with caching directives
```

---

## Quick Start Commands

```bash
# 1. Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh && sudo sh get-docker.sh

# 2. Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose && sudo chmod +x /usr/local/bin/docker-compose

# 3. Deploy
git clone <your-repo>
cd velampata
docker-compose -f docker-compose.prod.yml up -d --build

# 4. Access
# http://your-ec2-public-ip
# Admin: admin/admin123
```

Your application will be available at `http://your-ec2-public-ip` with full database persistence! 🚀 