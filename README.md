# Velampata - Multi-Tenant Voice-Enabled Item Management System

A full-stack web application with multi-tenant support, voice synthesis, and item management capabilities.

## 🚀 Features

- **Multi-Tenant Architecture**: Each tenant gets their own isolated space
- **Voice Synthesis**: Indian English female voice with natural accent
- **Admin Dashboard**: Complete tenant management
- **Real-time Updates**: Live data synchronization
- **Mobile-Friendly**: Responsive design for all devices

## 🏗️ Architecture

- **Frontend**: React + TypeScript + TailwindCSS
- **Backend**: Node.js + Express + PostgreSQL
- **Containerization**: Docker + Docker Compose
- **Voice**: Web Speech API with Indian English female voice

## 📋 Prerequisites

- Docker
- Docker Compose

## 🚀 Quick Start

1. **Clone and Navigate**:
   ```bash
   cd velampata
   ```

2. **Start the Application**:
   ```bash
   docker-compose up --build
   ```

3. **Access the Application**:
   - Main App: http://localhost:5173
   - About Page: http://localhost:5173/about

## 🔐 Admin Access

### Login Credentials
- **URL**: http://localhost:5173/admin/login
- **Username**: `admin`
- **Password**: `admin123`

### Admin Dashboard
- **URL**: http://localhost:5173/admin/dashboard
- **Features**:
  - Create new tenants
  - View all tenants
  - Delete tenants
  - Generate tenant URLs

## 🏢 Tenant Management

### Creating a Tenant
1. Login to admin dashboard
2. Enter tenant name and description
3. Click "Create Tenant"
4. System generates unique URL automatically

### Tenant URLs
Each tenant gets unique URLs:
- **Add Items**: `http://localhost:5173/t/{tenant-slug}/add`
- **View Items**: `http://localhost:5173/t/{tenant-slug}/view`

### Example Tenant URLs
- If tenant name is "My Store":
  - Add: `http://localhost:5173/t/my-store/add`
  - View: `http://localhost:5173/t/my-store/view`

## 🎤 Voice Features

### Voice Settings
- **Language**: Indian English (`en-IN`)
- **Voice Type**: Female with Indian accent
- **Speed**: Optimized for clarity (0.75x)
- **Pitch**: Slightly higher for female voice (1.15x)

### Voice Commands
Click buttons 1, 2, or 3 to hear:
- **Format**: `"Item Name ... Amount rupees ... 1st/2nd/3rd time"`
- **Example**: `"Rice ... 150 rupees ... 1st time"`

### Voice Priority
1. Indian English female voices
2. Indian/Hindi female voices  
3. High-quality neural voices

## 📊 API Endpoints

### Admin Endpoints
```
POST   /admin/login                    # Admin authentication
GET    /admin/tenants                  # List all tenants
POST   /admin/tenants                  # Create new tenant
DELETE /admin/tenants/:id              # Delete tenant
```

### Tenant Endpoints
```
GET    /tenant/:slug                   # Get tenant info
GET    /tenant/:slug/items             # List tenant items
POST   /tenant/:slug/items             # Add item to tenant
DELETE /tenant/:slug/items/:itemId     # Delete item from tenant
```

### Health Check
```
GET    /health                         # Backend health status
```

## 🗄️ Database Schema

### Tables
- **admins**: Admin user accounts
- **tenants**: Tenant information
- **items**: Items with tenant association

### Relationships
- Items belong to tenants (foreign key constraint)
- Cascade delete: Deleting tenant removes all items

## 🐳 Docker Services

### Services
- **frontend**: React app served via nginx (port 5173)
- **backend**: Node.js Express API (port 3000)
- **db**: PostgreSQL database (port 5432)

### Volumes
- **db_data**: Persistent PostgreSQL data

## 🔧 Development

### Local Development
```bash
# Backend
cd backend
npm install
npm run dev

# Frontend  
cd frontend
npm install
npm run dev
```

### Environment Variables
```env
# Backend
PORT=3000
PGHOST=db
PGPORT=5432
PGUSER=postgres
PGPASSWORD=postgres
PGDATABASE=velampata
JWT_SECRET=your-secret-key

# Frontend
VITE_API_BASE=/api
```

## 📱 Usage Guide

### For Administrators
1. **Login**: Use admin credentials
2. **Create Tenants**: Add new tenant organizations
3. **Manage Access**: Share tenant URLs with users
4. **Monitor**: View tenant activity and data

### For Tenants
1. **Access**: Use provided tenant URL
2. **Add Items**: Enter name and amount
3. **Voice Feedback**: Click 1, 2, or 3 buttons
4. **View Data**: Check read-only view page
5. **Delete Items**: Remove unwanted entries

### Voice Usage
- **Button 1**: "1st time" - First repetition
- **Button 2**: "2nd time" - Second repetition  
- **Button 3**: "3rd time" - Third repetition

## 🛠️ Troubleshooting

### Common Issues
1. **Voice not working**: Check browser permissions
2. **Tenant not found**: Verify tenant slug in URL
3. **Database errors**: Restart containers
4. **Build failures**: Clear Docker cache

### Logs
```bash
# View all logs
docker-compose logs

# View specific service
docker-compose logs backend
docker-compose logs frontend
```

## 🔒 Security

- **JWT Authentication**: Admin sessions
- **Tenant Isolation**: Data separation
- **Input Validation**: Server-side validation
- **CORS**: Configured for development

## 📈 Performance

- **Database**: Indexed queries
- **Frontend**: Optimized builds
- **Caching**: Browser caching enabled
- **Compression**: Gzip compression

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:
1. Check troubleshooting section
2. Review logs
3. Create issue with details

---

**Built with ❤️ using React, Node.js, PostgreSQL, and Docker** 