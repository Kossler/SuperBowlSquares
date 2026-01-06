# Super Bowl Squares - Project Summary

## 🎯 Project Overview

A full-stack web application for managing Super Bowl squares betting pools with multiple pools, user authentication, profile management, and admin controls.

## 📋 Features Implemented

### User Features
✅ **Authentication System**
- Email/password registration and login
- JWT token-based authentication
- Up to 9 profiles per user account
- Payment information storage (Venmo, CashApp, Zelle, PayPal)

✅ **Pool Management**
- View all active betting pools
- Multiple pool types (5A, 10A, 5B, 10B, 25A, etc.)
- Different bet amounts and payout structures
- Real-time pool statistics (claimed/available squares)

✅ **Squares Grid**
- Interactive 10x10 grid display
- Claim squares for any of your profiles
- Visual indicators:
  - Light gray: Available squares
  - Green: Claimed by others
  - Light blue: Your claimed squares
- Square locking (users can only modify their own squares)

✅ **Score Tracking**
- Real-time score updates for each quarter
- Display of AFC vs NFC scores
- Automatic refresh every 30 seconds on home page

### Admin Features
✅ **Pool Administration**
- Create new pools programmatically
- Set custom bet amounts and payouts per quarter
- Hard-set score combinations (AFC/NFC numbers)
- Toggle pool active/inactive status
- View all pools (active and inactive)

✅ **Score Management**
- Update scores for Q1, Q2 (Half), Q3, Q4, and Final
- Update AFC and NFC scores separately
- Track scoring by game name

✅ **Winner Tracking**
- View all winners by pool
- Access winner payment information
- Export winner data with contact details
- Payout amount tracking per quarter

## 🏗️ Technical Architecture

### Frontend
- **Framework**: React 18.2
- **Build Tool**: Vite 5.0
- **Router**: React Router DOM 6.21
- **HTTP Client**: Axios 1.6
- **Styling**: Custom CSS with responsive design
- **Authentication**: JWT token storage in localStorage

### Backend
- **Framework**: Spring Boot 3.2.1
- **Language**: Java 17
- **Security**: Spring Security with JWT
- **ORM**: Spring Data JPA (Hibernate)
- **Validation**: Jakarta Validation
- **Password Hashing**: BCrypt

### Database
- **Type**: MySQL 8.0
- **Tables**: 
  - users, profiles, payment_info
  - pools, squares
  - game_scores, winners
  - audit_log
- **Features**: Foreign keys, indexes, unique constraints

### Deployment
- **Frontend**: Cloudflare Pages (configured)
- **Backend**: Cloud provider (AWS/GCP/Azure recommended)
- **Database**: Cloud SQL or RDS
- **Proxy**: Optional Cloudflare Workers for API routing

## 📁 Project Structure

```
SuperBowlSquares/
├── backend/                    # Java Spring Boot API
│   ├── src/main/java/
│   │   └── com/superbowl/squares/
│   │       ├── config/        # Security & app configuration
│   │       ├── controller/    # REST controllers
│   │       ├── dto/          # Data transfer objects
│   │       ├── model/        # JPA entities
│   │       ├── repository/   # Data repositories
│   │       ├── security/     # JWT & authentication
│   │       └── service/      # Business logic
│   ├── src/main/resources/
│   │   └── application.properties
│   └── pom.xml               # Maven dependencies
│
├── frontend/                  # React application
│   ├── public/
│   │   └── _headers          # Cloudflare headers
│   ├── src/
│   │   ├── components/       # React components
│   │   │   ├── Navbar.jsx
│   │   │   └── SquaresGrid.jsx
│   │   ├── pages/            # Page components
│   │   │   ├── Home.jsx
│   │   │   ├── Entry.jsx
│   │   │   ├── Login.jsx
│   │   │   └── Admin.jsx
│   │   ├── services/         # API services
│   │   │   ├── api.js
│   │   │   └── squaresService.js
│   │   ├── utils/            # Utilities
│   │   │   └── auth.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── database/                  # SQL scripts
│   ├── schema.sql            # Database schema
│   └── seed.sql              # Initial data
│
├── cloudflare/               # Deployment configs
│   ├── DEPLOYMENT.md
│   └── workers/              # Optional API proxy
│
├── .github/
│   └── instructions/
│       └── snyk_rules.instructions.md
│
├── README.md
├── SECURITY_REPORT.md
└── .gitignore
```

## 🚀 Quick Start Guide

### 1. Database Setup
```bash
# Create database and tables
mysql -u root -p < database/schema.sql

# Load seed data (includes default admin)
mysql -u root -p < database/seed.sql
```

### 2. Backend Setup
```bash
cd backend

# Update database credentials in src/main/resources/application.properties

# Run the application
mvn spring-boot:run
```

Backend runs at: `http://localhost:8080/api`

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

Frontend runs at: `http://localhost:5173`

### 4. Login Credentials
**Default Admin Account:**
- Email: `admin@superbowlsquares.com`
- Password: `Admin123!`

⚠️ **Change these credentials before production deployment!**

## 🔒 Security Features

- ✅ JWT token authentication
- ✅ BCrypt password hashing
- ✅ Role-based access control
- ✅ CORS configuration
- ✅ Input validation
- ✅ SQL injection prevention (JPA)
- ✅ XSS protection (React)
- ✅ Secure headers

**Security Scan Results**: Passed ✅ (see SECURITY_REPORT.md)

## 📊 API Endpoints

### Public Endpoints
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `GET /api/pools/active` - Get active pools
- `GET /api/squares/pool/{id}` - Get squares for pool
- `GET /api/scores` - Get current scores

### Protected Endpoints (Requires JWT)
- `POST /api/squares/claim` - Claim a square
- `GET /api/squares/pool/{id}/stats` - Pool statistics

### Admin Endpoints (Requires ROLE_ADMIN)
- `POST /admin/pools` - Create new pool
- `PUT /admin/scores` - Update game scores
- `GET /admin/winners/payment-info` - Get winners with payment info

## 🎨 User Interface

### Home Page
- Pool selection dropdown
- Current scores display (all quarters)
- Live squares grid showing all claimed squares
- Color-coded grid for easy viewing

### Entry Page
- Pool selection with payout information
- Interactive grid for claiming squares
- Profile selection modal
- Real-time statistics (claimed/available)

### Login/Signup Page
- Email and password authentication
- Multiple profile creation (up to 9)
- Payment information collection
- Toggle between login and signup

### Admin Page
- Three tabs: Pools, Scores, Winners
- Pool creation with custom payouts
- Score updating for each quarter
- Winner tracking with payment details

## 📦 Deployment Options

### Recommended Architecture
```
Frontend (Cloudflare Pages)
    ↓
Backend API (AWS EC2 / GCP / Azure)
    ↓
MySQL Database (RDS / Cloud SQL)
```

### Deployment Steps
1. Build frontend: `npm run build`
2. Deploy to Cloudflare Pages (automatic from GitHub)
3. Package backend: `mvn clean package`
4. Deploy JAR to cloud provider
5. Configure MySQL database on cloud
6. Update environment variables and CORS settings

See `cloudflare/DEPLOYMENT.md` for detailed instructions.

## 🔧 Configuration

### Backend Configuration (`application.properties`)
- Database connection
- JWT secret key
- Token expiration
- CORS allowed origins
- Server port

### Frontend Configuration (`vite.config.js`)
- API proxy settings
- Build output directory
- Development server port

## 📈 Future Enhancements

### Potential Features
- [ ] Email notifications for winners
- [ ] Payment integration (Stripe/PayPal API)
- [ ] Real-time updates using WebSockets
- [ ] Mobile app (React Native)
- [ ] Multiple games support
- [ ] Historical data and analytics
- [ ] Social features (comments, chat)
- [ ] Automated winner calculation based on scores
- [ ] Export grid as PDF/image
- [ ] Multi-language support

## 🤝 Contributing

When contributing to this project:
1. Follow the existing code structure
2. Add comments for complex logic
3. Update documentation
4. Run Snyk security scans before committing
5. Test all features thoroughly

## 📝 License

This project is created for educational and personal use.

## 🙏 Support

For issues or questions:
1. Check the README files in each directory
2. Review SECURITY_REPORT.md for security guidelines
3. See DEPLOYMENT.md for deployment help

---

**Built with ❤️ using React, Spring Boot, and MySQL**
