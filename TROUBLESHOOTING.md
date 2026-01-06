# Troubleshooting Guide

## Common Issues and Solutions

### 🔴 Backend Issues

#### "Failed to configure a DataSource"
**Symptoms**: Backend won't start, error mentions datasource configuration

**Solutions**:
1. Check MySQL is running:
   ```bash
   # Windows
   net start MySQL80
   
   # macOS/Linux
   sudo systemctl status mysql
   ```

2. Verify database exists:
   ```bash
   mysql -u root -p -e "SHOW DATABASES;"
   # Should show 'superbowl_squares'
   ```

3. Check credentials in `application.properties`:
   ```properties
   spring.datasource.username=root
   spring.datasource.password=YOUR_PASSWORD
   ```

4. Test connection manually:
   ```bash
   mysql -u root -p superbowl_squares
   # If this fails, fix MySQL first
   ```

#### "Port 8080 already in use"
**Symptoms**: `java.net.BindException: Address already in use`

**Solutions**:
1. Find what's using port 8080:
   ```bash
   # Windows
   netstat -ano | findstr :8080
   taskkill /PID [PID] /F
   
   # macOS/Linux
   lsof -i :8080
   kill -9 [PID]
   ```

2. Or change the port in `application.properties`:
   ```properties
   server.port=8081
   ```
   Then update frontend `vite.config.js` proxy target.

#### "Access denied for user"
**Symptoms**: Authentication error when connecting to MySQL

**Solutions**:
1. Reset MySQL root password:
   ```bash
   mysqladmin -u root password newpassword
   ```

2. Grant proper privileges:
   ```sql
   mysql -u root -p
   GRANT ALL PRIVILEGES ON superbowl_squares.* TO 'root'@'localhost';
   FLUSH PRIVILEGES;
   ```

3. Update `application.properties` with correct password

#### "Table doesn't exist"
**Symptoms**: `SQLException: Table 'superbowl_squares.users' doesn't exist`

**Solutions**:
1. Run schema script:
   ```bash
   mysql -u root -p superbowl_squares < database/schema.sql
   ```

2. Verify tables created:
   ```bash
   mysql -u root -p -e "USE superbowl_squares; SHOW TABLES;"
   ```

#### "JWT Token expired" or "Invalid token"
**Symptoms**: Users getting logged out, 401 errors

**Solutions**:
1. Check token expiration setting:
   ```properties
   jwt.expiration=86400000  # 24 hours in milliseconds
   ```

2. Clear browser localStorage and re-login

3. Verify JWT secret is set correctly (minimum 256 bits)

---

### 🔴 Frontend Issues

#### "CORS Error"
**Symptoms**: `Access to fetch at ... has been blocked by CORS policy`

**Solutions**:
1. Check backend CORS configuration in `application.properties`:
   ```properties
   cors.allowed-origins=http://localhost:5173,http://localhost:3000
   ```

2. Verify SecurityConfig allows your origin

3. Clear browser cache and restart both servers

#### "Network Error" or "ERR_CONNECTION_REFUSED"
**Symptoms**: Frontend can't connect to backend

**Solutions**:
1. Verify backend is running:
   ```bash
   curl http://localhost:8080/api/auth/health
   # Should return: OK
   ```

2. Check proxy configuration in `vite.config.js`:
   ```javascript
   proxy: {
     '/api': {
       target: 'http://localhost:8080',
       changeOrigin: true,
     },
   }
   ```

3. Restart frontend dev server

#### "Module not found" errors
**Symptoms**: Build fails with missing module errors

**Solutions**:
1. Delete and reinstall dependencies:
   ```bash
   cd frontend
   rm -rf node_modules package-lock.json
   npm install
   ```

2. Clear npm cache:
   ```bash
   npm cache clean --force
   npm install
   ```

#### Grid not displaying correctly
**Symptoms**: Squares overlap, misaligned, or not showing

**Solutions**:
1. Clear browser cache (Ctrl+Shift+Delete)
2. Check browser console for JavaScript errors
3. Verify CSS files are loading (Network tab)
4. Try different browser

#### Squares not clickable or claiming fails
**Symptoms**: Can't claim squares, modal doesn't open

**Solutions**:
1. Check if logged in (JWT token in localStorage)
2. Verify you have profiles created
3. Check browser console for errors
4. Ensure pool ID is valid

---

### 🔴 Database Issues

#### "Too many connections"
**Symptoms**: `SQLException: Too many connections`

**Solutions**:
1. Check current connections:
   ```sql
   SHOW PROCESSLIST;
   ```

2. Increase max connections in MySQL:
   ```sql
   SET GLOBAL max_connections = 200;
   ```

3. Configure connection pool in `application.properties`:
   ```properties
   spring.datasource.hikari.maximum-pool-size=10
   spring.datasource.hikari.minimum-idle=5
   ```

#### "Deadlock found when trying to get lock"
**Symptoms**: Transactions failing with deadlock error

**Solutions**:
1. This is rare but can happen under heavy load
2. The application will automatically retry
3. If persistent, check for long-running transactions
4. Consider adding database indexes

#### Database is slow
**Symptoms**: Queries taking long time, timeouts

**Solutions**:
1. Check database size:
   ```sql
   SELECT 
     table_name, 
     ROUND(((data_length + index_length) / 1024 / 1024), 2) AS "Size (MB)"
   FROM information_schema.TABLES
   WHERE table_schema = 'superbowl_squares';
   ```

2. Add missing indexes (check schema.sql - should already have them)

3. Analyze slow queries:
   ```sql
   SET GLOBAL slow_query_log = 'ON';
   SET GLOBAL long_query_time = 2;
   ```

---

### 🔴 Authentication Issues

#### "Invalid credentials" on login
**Symptoms**: Correct password fails

**Solutions**:
1. Verify email is correct (case-sensitive)
2. Check if user exists:
   ```sql
   SELECT email FROM users WHERE email = 'your@email.com';
   ```

3. If using default admin, ensure seed.sql ran:
   ```sql
   SELECT * FROM users WHERE is_admin = TRUE;
   ```

4. Reset password in database:
   ```sql
   -- Generate new hash at: https://bcrypt-generator.com/
   UPDATE users 
   SET password_hash = '$2a$10$...' 
   WHERE email = 'your@email.com';
   ```

#### User can't access protected routes
**Symptoms**: Redirected to login when authenticated

**Solutions**:
1. Check localStorage has token:
   ```javascript
   // In browser console
   localStorage.getItem('superbowl_token')
   ```

2. Verify token is valid (not expired)
3. Check Authorization header is being sent
4. Clear localStorage and re-login

---

### 🔴 Admin Issues

#### Can't create pools
**Symptoms**: "Forbidden" or "Access Denied"

**Solutions**:
1. Verify logged-in user is admin:
   ```sql
   SELECT email, is_admin FROM users WHERE email = 'your@email.com';
   ```

2. If not admin, set manually:
   ```sql
   UPDATE users SET is_admin = TRUE WHERE email = 'your@email.com';
   ```

3. Re-login to get new token with admin role

#### Score updates not saving
**Symptoms**: Scores don't persist or show errors

**Solutions**:
1. Check game name matches exactly
2. Verify quarter enum values: Q1, Q2, Q3, Q4, FINAL
3. Check backend logs for validation errors
4. Ensure scores are valid integers (0-999)

---

### 🔴 Development Issues

#### Hot reload not working
**Symptoms**: Changes don't appear without manual refresh

**Solutions**:
1. **Frontend**: Vite HMR should work automatically
   - Restart dev server: `npm run dev`
   - Check no syntax errors in console

2. **Backend**: Spring DevTools should work
   - Verify DevTools is in pom.xml
   - Restart: `mvn spring-boot:run`

#### Maven build fails
**Symptoms**: Build errors, dependency issues

**Solutions**:
1. Clean and rebuild:
   ```bash
   mvn clean install
   ```

2. Update Maven:
   ```bash
   mvn -version  # Should be 3.6+
   ```

3. Delete local Maven cache:
   ```bash
   rm -rf ~/.m2/repository
   mvn clean install
   ```

#### Tests failing
**Symptoms**: `mvn test` shows failures

**Solutions**:
1. Check if database is running
2. Verify test database configuration
3. Run specific test:
   ```bash
   mvn -Dtest=TestClassName test
   ```

---

### 🔴 Production Issues

#### High CPU usage
**Solutions**:
1. Check for infinite loops in logs
2. Monitor database query performance
3. Implement caching (Redis)
4. Scale horizontally (add more instances)

#### Memory leaks
**Solutions**:
1. Monitor JVM heap:
   ```bash
   jstat -gc [PID] 1000
   ```

2. Increase heap size:
   ```bash
   java -Xms512m -Xmx1024m -jar app.jar
   ```

3. Profile with VisualVM or JProfiler

#### High database connections
**Solutions**:
1. Reduce connection pool size:
   ```properties
   spring.datasource.hikari.maximum-pool-size=5
   ```

2. Check for connection leaks (unclosed connections)
3. Monitor with database metrics

---

## Debug Mode

### Enable Debug Logging

**Backend** (`application.properties`):
```properties
logging.level.root=DEBUG
logging.level.org.springframework.web=DEBUG
logging.level.org.springframework.security=DEBUG
```

**Frontend** (Browser Console):
- Open DevTools (F12)
- Check Console tab for errors
- Check Network tab for failed requests
- Use React DevTools extension

### Health Checks

```bash
# Backend health
curl http://localhost:8080/api/auth/health

# Database connection
mysql -u root -p -e "SELECT 1"

# Frontend
curl http://localhost:5173
```

---

## Getting Help

### Check Logs

**Backend logs**:
- Console output where `mvn spring-boot:run` is running
- Look for stack traces and error messages

**Frontend logs**:
- Browser DevTools → Console tab
- Look for red errors

**Database logs**:
- MySQL error log location varies by OS
- Windows: `C:\ProgramData\MySQL\MySQL Server 8.0\Data\`
- macOS/Linux: `/var/log/mysql/error.log`

### Useful Commands

```bash
# Check if services are running
# Windows
netstat -ano | findstr "8080 5173 3306"

# macOS/Linux
lsof -i :8080 -i :5173 -i :3306

# Check Java version
java -version

# Check Node version
node -v

# Check MySQL version
mysql --version

# Check disk space
df -h  # Linux/macOS
dir    # Windows
```

### Documentation References

- Spring Boot: https://docs.spring.io/spring-boot/docs/current/reference/html/
- React: https://react.dev/
- MySQL: https://dev.mysql.com/doc/
- Vite: https://vitejs.dev/

---

## Still Stuck?

1. Check [GETTING_STARTED.md](GETTING_STARTED.md) for setup instructions
2. Review [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) for architecture
3. See [SECURITY_REPORT.md](SECURITY_REPORT.md) for security issues
4. Read backend/frontend README files for specific component docs

**Remember**: Most issues are configuration-related. Double-check:
- Database credentials
- Port numbers
- File paths
- Environment variables
