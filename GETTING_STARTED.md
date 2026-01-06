# 🎯 Getting Started - Super Bowl Squares

Welcome! This guide will help you get the Super Bowl Squares application running on your local machine in under 10 minutes.

## Prerequisites Checklist

Before you begin, ensure you have:

- [ ] **Java 17 or higher** - [Download Java](https://adoptium.net/)
  ```bash
  java -version  # Should show version 17+
  ```

- [ ] **Maven 3.6+** - [Download Maven](https://maven.apache.org/download.cgi)
  ```bash
  mvn -version
  ```

- [ ] **Node.js 18+** - [Download Node.js](https://nodejs.org/)
  ```bash
  node -v  # Should show v18+
  npm -v
  ```

- [ ] **MySQL 8.0+** - [Download MySQL](https://dev.mysql.com/downloads/)
  ```bash
  mysql --version
  ```

## Step-by-Step Setup

### Step 1: Set Up the Database (5 minutes)

1. **Start MySQL** (if not already running)
   ```bash
   # Windows (as Administrator)
   net start MySQL80
   
   # macOS/Linux
   sudo systemctl start mysql
   ```

2. **Create the database**
   ```bash
   mysql -u root -p < database/schema.sql
   ```
   Enter your MySQL root password when prompted.

3. **Load seed data** (includes default admin account)
   ```bash
   mysql -u root -p < database/seed.sql
   ```

### Step 2: Configure the Backend (2 minutes)

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Update database credentials**
   
   Open `src/main/resources/application.properties` and update:
   ```properties
   spring.datasource.username=root
   spring.datasource.password=YOUR_MYSQL_PASSWORD
   ```

3. **Start the backend server**
   ```bash
   mvn spring-boot:run
   ```

   Wait for the message: `Started SuperBowlSquaresApplication`
   
   Backend is now running at: **http://localhost:8080/api** ✅

### Step 3: Set Up the Frontend (2 minutes)

**Open a NEW terminal/command prompt** (keep the backend running)

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```
   This will take 1-2 minutes.

3. **Start the development server**
   ```bash
   npm run dev
   ```

   Frontend is now running at: **http://localhost:5173** ✅

### Step 4: Test the Application (1 minute)

1. **Open your browser** and go to: http://localhost:5173

2. **Log in with default admin credentials:**
   - Email: `admin@superbowlsquares.com`
   - Password: `Admin123!`

3. **Explore the features:**
   - View the Home page (grid display)
   - Click "Entry" to claim squares
   - Click "Admin" to manage pools and scores

## Common Issues & Solutions

### ❌ "Port 8080 is already in use"

**Solution:** Change the backend port in `backend/src/main/resources/application.properties`:
```properties
server.port=8081
```

Then update frontend proxy in `frontend/vite.config.js`:
```javascript
target: 'http://localhost:8081'
```

### ❌ "Access denied for user"

**Solution:** Check MySQL credentials in `application.properties`. Make sure your MySQL user has proper permissions:
```sql
mysql -u root -p
GRANT ALL PRIVILEGES ON superbowl_squares.* TO 'root'@'localhost';
FLUSH PRIVILEGES;
```

### ❌ "Database 'superbowl_squares' doesn't exist"

**Solution:** Re-run the schema creation:
```bash
mysql -u root -p -e "CREATE DATABASE superbowl_squares;"
mysql -u root -p < database/schema.sql
mysql -u root -p < database/seed.sql
```

### ❌ "npm install" fails

**Solution:** Clear npm cache and retry:
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### ❌ Frontend can't connect to backend

**Solution:** 
1. Verify backend is running on http://localhost:8080
2. Check browser console for CORS errors
3. Ensure `cors.allowed-origins` in `application.properties` includes `http://localhost:5173`

## What's Next?

### For Users
1. **Create your account** - Click "Sign Up" and create profiles
2. **Join a pool** - Select a pool from the dropdown
3. **Claim squares** - Click available squares to claim them
4. **Watch the game** - Scores update in real-time!

### For Admins
1. **Create pools** - Go to Admin → Pools → Create New Pool
2. **Update scores** - Go to Admin → Scores tab
3. **View winners** - Go to Admin → Winners tab

### For Developers
1. **Read the docs:**
   - `backend/README.md` - Backend API documentation
   - `frontend/README.md` - Frontend structure
   - `PROJECT_SUMMARY.md` - Complete feature list
   - `SECURITY_REPORT.md` - Security guidelines

2. **Explore the code:**
   - Backend controllers: `backend/src/main/java/com/superbowl/squares/controller/`
   - Frontend pages: `frontend/src/pages/`
   - Database schema: `database/schema.sql`

3. **Make changes:**
   - Backend changes auto-reload with Spring DevTools
   - Frontend changes auto-reload with Vite HMR

## Quick Commands Reference

```bash
# Start everything from scratch
cd backend && mvn spring-boot:run &
cd ../frontend && npm install && npm run dev

# Build for production
cd backend && mvn clean package
cd ../frontend && npm run build

# Run tests
cd backend && mvn test
cd ../frontend && npm test

# Check for security issues
# (Snyk scans already run, check SECURITY_REPORT.md)
```

## Need Help?

- 📖 Check `PROJECT_SUMMARY.md` for complete documentation
- 🔒 Review `SECURITY_REPORT.md` for security best practices
- 🚀 See `cloudflare/DEPLOYMENT.md` for production deployment
- 💬 Common API endpoints are documented in `backend/README.md`

## Success! 🎉

If you can see the grid at http://localhost:5173 and log in, you're all set!

**Default Admin Credentials:**
- Email: `admin@superbowlsquares.com`
- Password: `Admin123!`

**Remember:** Change these credentials before deploying to production!

---

**Enjoy your Super Bowl Squares! 🏈**
