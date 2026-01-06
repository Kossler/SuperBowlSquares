# Production Deployment Checklist

## ⚠️ CRITICAL - Must Complete Before Going Live

### 1. Security Configuration

#### Backend (application.properties)
- [ ] **Generate new JWT secret** (minimum 256 bits)
  ```properties
  # Current (INSECURE): jwt.secret=your-super-secret-jwt-key-change-this...
  # Change to: jwt.secret=[GENERATE 64+ RANDOM CHARACTERS]
  ```
  Generate with: `openssl rand -base64 64`

- [ ] **Change database password**
  ```properties
  spring.datasource.password=[STRONG_PASSWORD]
  ```

- [ ] **Update CORS origins**
  ```properties
  cors.allowed-origins=https://your-domain.pages.dev,https://your-custom-domain.com
  ```

- [ ] **Disable SQL logging**
  ```properties
  spring.jpa.show-sql=false
  ```

- [ ] **Set to production profile**
  ```properties
  spring.profiles.active=production
  ```

#### Database
- [ ] **Change admin password**
  ```sql
  UPDATE users 
  SET password_hash = '[NEW_BCRYPT_HASH]' 
  WHERE email = 'admin@superbowlsquares.com';
  ```
  Generate hash: Use BCrypt with cost factor 10+

- [ ] **Create dedicated database user** (don't use root)
  ```sql
  CREATE USER 'squares_app'@'%' IDENTIFIED BY '[STRONG_PASSWORD]';
  GRANT SELECT, INSERT, UPDATE, DELETE ON superbowl_squares.* TO 'squares_app'@'%';
  FLUSH PRIVILEGES;
  ```

### 2. Environment Variables

#### Backend Environment Variables
```bash
# Set these in your hosting provider's environment config
DATABASE_URL=jdbc:mysql://[HOST]:[PORT]/superbowl_squares
DATABASE_USERNAME=squares_app
DATABASE_PASSWORD=[STRONG_PASSWORD]
JWT_SECRET=[GENERATED_SECRET]
JWT_EXPIRATION=86400000
CORS_ORIGINS=https://your-frontend-domain.com
```

#### Frontend Environment Variables (Cloudflare Pages)
```bash
VITE_API_URL=https://your-backend-api.com/api
```

### 3. SSL/HTTPS Configuration

- [ ] **Frontend**: Cloudflare provides automatic HTTPS ✅
- [ ] **Backend**: Configure SSL certificate
  - AWS: Use AWS Certificate Manager
  - GCP: Use Google-managed SSL certificates
  - Azure: Use Azure App Service certificates
  - Custom: Let's Encrypt with certbot

- [ ] **Database**: Enable SSL/TLS connections
  ```properties
  spring.datasource.url=jdbc:mysql://[HOST]:[PORT]/superbowl_squares?useSSL=true&requireSSL=true
  ```

### 4. Performance Optimization

#### Backend
- [ ] **Enable connection pooling**
  ```properties
  spring.datasource.hikari.maximum-pool-size=10
  spring.datasource.hikari.minimum-idle=5
  ```

- [ ] **Add database indexes** (already in schema.sql ✅)

- [ ] **Configure caching** (optional but recommended)
  ```xml
  <!-- Add to pom.xml -->
  <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-cache</artifactId>
  </dependency>
  ```

#### Frontend
- [ ] **Build for production**
  ```bash
  npm run build
  ```
  Vite automatically optimizes: minification, tree-shaking, code splitting ✅

- [ ] **Enable Cloudflare caching**
  - Configure cache rules in Cloudflare dashboard
  - Cache static assets (CSS, JS, images)

### 5. Monitoring & Logging

#### Backend
- [ ] **Configure logging levels**
  ```properties
  logging.level.root=WARN
  logging.level.com.superbowl.squares=INFO
  ```

- [ ] **Set up log aggregation** (optional but recommended)
  - AWS: CloudWatch Logs
  - GCP: Cloud Logging
  - Third-party: Datadog, New Relic, Loggly

- [ ] **Enable health checks**
  ```properties
  management.endpoints.web.exposure.include=health,info
  management.endpoint.health.show-details=always
  ```

#### Monitoring Tools
- [ ] Set up uptime monitoring (UptimeRobot, Pingdom)
- [ ] Configure error tracking (Sentry, Rollbar)
- [ ] Set up performance monitoring (New Relic, AppDynamics)

### 6. Backup & Recovery

- [ ] **Automated database backups**
  - AWS RDS: Enable automatic backups (retention: 7-30 days)
  - GCP Cloud SQL: Enable automated backups
  - Manual: Set up cron job for mysqldump

- [ ] **Backup schedule**
  - Full backup: Daily
  - Incremental: Hourly (for high-traffic)
  - Retention: 30 days minimum

- [ ] **Test restore procedure**
  - Document restore steps
  - Practice restore on staging environment

### 7. Security Hardening

#### Application
- [ ] **Enable rate limiting**
  ```java
  // Add to SecurityConfig or create RateLimitingFilter
  // Limit: 100 requests per minute per IP
  ```

- [ ] **Add request size limits**
  ```properties
  spring.servlet.multipart.max-file-size=10MB
  spring.servlet.multipart.max-request-size=10MB
  ```

- [ ] **Enable security headers**
  Already configured in SecurityConfig ✅

#### Network
- [ ] Configure firewall rules
  - Backend: Allow only from frontend domains and admin IPs
  - Database: Allow only from backend server IPs

- [ ] Use VPC/Private network (recommended)
  - Keep database in private subnet
  - Backend in application subnet
  - Only frontend publicly accessible

#### Cloudflare
- [ ] **Enable WAF** (Web Application Firewall)
- [ ] **Enable DDoS protection**
- [ ] **Configure rate limiting rules**
- [ ] **Enable bot protection**

### 8. Testing

- [ ] **Load testing**
  ```bash
  # Use Apache Bench or similar
  ab -n 1000 -c 10 https://your-api.com/api/pools/active
  ```

- [ ] **Security scanning**
  ```bash
  # Already done with Snyk ✅
  # Run again before deployment
  ```

- [ ] **End-to-end testing**
  - Test user registration flow
  - Test square claiming
  - Test admin functions
  - Test on multiple browsers and devices

### 9. Documentation

- [ ] Update API documentation with production URLs
- [ ] Document deployment process
- [ ] Create runbook for common issues
- [ ] Document emergency procedures

### 10. Legal & Compliance

- [ ] **Add Terms of Service**
- [ ] **Add Privacy Policy**
- [ ] **Add Cookie Policy** (if using analytics)
- [ ] **GDPR compliance** (if serving EU users)
  - User data export
  - User data deletion
  - Cookie consent
- [ ] **Age verification** (18+ for gambling)
- [ ] **State/Country restrictions** (check gambling laws)

## Post-Deployment

### Immediate Actions (First 24 Hours)
- [ ] Monitor error logs continuously
- [ ] Check performance metrics
- [ ] Test all critical features
- [ ] Verify email notifications (if added)
- [ ] Monitor database connections

### First Week
- [ ] Review security logs
- [ ] Check backup success
- [ ] Monitor server resources (CPU, memory, disk)
- [ ] Gather user feedback
- [ ] Address any reported issues

### Ongoing
- [ ] Weekly security updates
- [ ] Monthly dependency updates
- [ ] Quarterly security audits
- [ ] Regular backup testing

## Rollback Plan

If something goes wrong:

1. **Frontend**: Cloudflare Pages keeps previous deployments
   - Go to Cloudflare Pages dashboard
   - Select previous deployment
   - Click "Rollback"

2. **Backend**: Keep previous version
   ```bash
   # Stop current version
   # Deploy previous JAR file
   java -jar squares-1.0.0-previous.jar
   ```

3. **Database**: Restore from backup
   ```bash
   mysql -u root -p superbowl_squares < backup-YYYY-MM-DD.sql
   ```

## Emergency Contacts

Document:
- [ ] Hosting provider support contacts
- [ ] Domain registrar support
- [ ] Database hosting support
- [ ] Team member contact information

## Cost Estimates

### Minimum Setup (Small scale, <1000 users)
- **Frontend**: Cloudflare Pages - **$0-20/month**
- **Backend**: AWS EC2 t3.micro - **$10/month**
- **Database**: AWS RDS t3.micro - **$15/month**
- **Domain**: Namecheap/Google - **$12/year**
- **Total**: ~$35-50/month

### Recommended Setup (Medium scale, <10000 users)
- **Frontend**: Cloudflare Pages Pro - **$20/month**
- **Backend**: AWS EC2 t3.small - **$20/month**
- **Database**: AWS RDS t3.small - **$30/month**
- **Monitoring**: Basic plan - **$20/month**
- **Total**: ~$90/month

### High Scale (>10000 users)
- **Frontend**: Cloudflare Pages Business - **$200/month**
- **Backend**: AWS EC2 cluster - **$200+/month**
- **Database**: AWS RDS with Multi-AZ - **$150+/month**
- **CDN/Cache**: Redis - **$50/month**
- **Monitoring & Logging**: **$100+/month**
- **Total**: ~$700+/month

## Support Resources

- AWS Support: https://aws.amazon.com/support/
- Cloudflare Support: https://support.cloudflare.com/
- Spring Boot Docs: https://spring.io/projects/spring-boot
- React Docs: https://react.dev/

---

**Last Updated**: 2026-01-05
**Review Date**: Before each deployment

**Remember**: It's better to spend extra time on security and testing than to deal with a breach or outage!
