# Super Bowl Squares Application

A full-stack application for managing Super Bowl squares betting pools with real-time score tracking, multiple pools, and comprehensive admin controls.

## 🚀 Quick Start

**New here?** Start with [GETTING_STARTED.md](GETTING_STARTED.md) for a step-by-step setup guide.

## 📚 Documentation

- **[GETTING_STARTED.md](GETTING_STARTED.md)** - Quick setup guide (< 10 minutes)
- **[PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)** - Complete feature list and architecture
- **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Common issues and solutions
- **[SECURITY_REPORT.md](SECURITY_REPORT.md)** - Security analysis and best practices
- **[PRODUCTION_CHECKLIST.md](PRODUCTION_CHECKLIST.md)** - Pre-deployment checklist
- **[backend/README.md](backend/README.md)** - Backend API documentation
- **[frontend/README.md](frontend/README.md)** - Frontend development guide
- **[cloudflare/DEPLOYMENT.md](cloudflare/DEPLOYMENT.md)** - Production deployment guide

## 🎯 Features

✅ User authentication with up to 9 profiles per account  
✅ Multiple betting pools (5A, 10A, 5B, 10B, 25A, custom)  
✅ Interactive 10x10 squares grid with color coding  
✅ Real-time score updates for each quarter  
✅ Admin panel for pool creation and management  
✅ Payment info tracking (Venmo, CashApp, Zelle, PayPal)  
✅ Winner tracking with automatic payout calculations  
✅ Responsive design for mobile and desktop  

## 🛠️ Tech Stack

- **Frontend**: React 18 + Vite + React Router
- **Backend**: Java 17 + Spring Boot 3.2 + Spring Security
- **Database**: MySQL 8.0 with JPA/Hibernate
- **Authentication**: JWT tokens with BCrypt password hashing
- **Deployment**: Cloudflare Pages (Frontend) + Cloud hosting (Backend)

## 📋 Project Structure

```
SuperBowlSquares/
├── backend/              # Java Spring Boot API
│   ├── src/             # Source code (controllers, services, models)
│   └── pom.xml          # Maven dependencies
├── frontend/            # React application
│   ├── src/            # Components, pages, services
│   └── package.json    # npm dependencies
├── database/           # SQL schema and seed data
├── cloudflare/         # Deployment configurations
└── docs/              # Additional documentation
```

## ⚡ Quick Commands

```bash
# Database setup
mysql -u root -p < database/schema.sql
mysql -u root -p < database/seed.sql

# Start backend (Terminal 1)
cd backend && mvn spring-boot:run

# Start frontend (Terminal 2)
cd frontend && npm install && npm run dev

# Access the app
# Frontend: http://localhost:5173
# Backend API: http://localhost:8080/api
```

## 🧪 Testing

### Backend Tests
- Run all backend unit and integration tests:
	```bash
	cd backend
	mvn test
	```
- See [backend/README.md](backend/README.md) for more details and troubleshooting.

### Frontend Tests
- Run all frontend tests (using Vitest):
	```bash
	cd frontend
	npm test
	```
- See [frontend/README.md](frontend/README.md) for more details and troubleshooting.

**Tip:** For end-to-end (E2E) tests, see `frontend/cypress/e2e/` and run with Cypress if configured.

## 🔐 Default Admin Credentials

- **Email**: `admin@superbowlsquares.com`
- **Password**: `Admin123!`

⚠️ **Important**: Change these credentials before production deployment!

## 🔒 Security

- ✅ Passed Snyk security scans
- ✅ JWT authentication
- ✅ BCrypt password hashing
- ✅ CORS protection
- ✅ Input validation
- ✅ SQL injection prevention

See [SECURITY_REPORT.md](SECURITY_REPORT.md) for detailed security analysis.

## 📊 API Endpoints

### Public
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `GET /api/pools/active` - Get active pools
- `GET /api/scores` - Get current scores

### Protected (Requires Authentication)
- `POST /api/squares/claim` - Claim a square
- `GET /api/squares/pool/{id}/stats` - Pool statistics

### Admin Only
- `POST /admin/pools` - Create new pool
- `PUT /admin/scores` - Update scores
- `GET /admin/winners/payment-info` - Get winners

Full API documentation in [backend/README.md](backend/README.md)

## 🚀 Deployment

The application is designed to be deployed with:
- **Frontend**: Cloudflare Pages (automatic GitHub integration)
- **Backend**: AWS, GCP, Azure, or DigitalOcean
- **Database**: RDS, Cloud SQL, or PlanetScale

See [cloudflare/DEPLOYMENT.md](cloudflare/DEPLOYMENT.md) for detailed deployment instructions.

## 🤝 Contributing

1. Follow the existing code structure
2. Run Snyk security scans before committing
3. Update documentation for new features
4. Test thoroughly on both mobile and desktop

## 📝 License

Created for educational and personal use.

## 💡 Support

- Check [GETTING_STARTED.md](GETTING_STARTED.md) for setup issues
- Review [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) for features
- See [SECURITY_REPORT.md](SECURITY_REPORT.md) for security guidelines

---

**Built with ❤️ using React, Spring Boot, and MySQL**
