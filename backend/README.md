# Backend Setup and Running Guide

## Prerequisites

- Java 17 or higher
- Maven 3.6+
- MySQL 8.0+

## Database Setup

1. Create the database and tables:
   ```bash
   mysql -u root -p < ../database/schema.sql
   ```

2. Seed initial data:
   ```bash
   mysql -u root -p < ../database/seed.sql
   ```

3. Update database credentials in `src/main/resources/application.properties`:
   ```properties
   spring.datasource.username=your_username
   spring.datasource.password=your_password
   ```

## Running the Application

### Development Mode

```bash
mvn spring-boot:run
```

The API will be available at `http://localhost:8080/api`

### Build for Production

```bash
mvn clean package
java -jar target/squares-1.0.0.jar
```

## API Documentation

### Authentication Endpoints

- `POST /api/auth/signup` - Create new user account
- `POST /api/auth/login` - Login user
- `GET /api/auth/health` - Health check

### Pool Endpoints

- `GET /api/pools/active` - Get all active pools
- `GET /api/pools/{id}` - Get pool by ID

### Square Endpoints

- `GET /api/squares/pool/{poolId}` - Get all squares for a pool
- `POST /api/squares/claim` - Claim a square (requires authentication)
- `GET /api/squares/pool/{poolId}/stats` - Get pool statistics

### Score Endpoints

- `GET /api/scores` - Get all game scores
- `GET /api/scores/{gameName}/{quarter}` - Get specific quarter score

### Admin Endpoints (Requires ROLE_ADMIN)

- `POST /admin/pools` - Create new pool
- `GET /admin/pools` - Get all pools
- `PATCH /admin/pools/{id}/toggle` - Toggle pool active status
- `PUT /admin/scores` - Update game scores
- `GET /admin/winners/pool/{poolId}` - Get winners for a pool
- `GET /admin/winners/payment-info` - Get all winners with payment info

## Default Admin Credentials

- Email: `admin@superbowlsquares.com`
- Password: `Admin123!`

**Important:** Change these credentials in production!

## Configuration

Key configuration options in `application.properties`:

- `server.port` - Server port (default: 8080)
- `spring.datasource.url` - Database connection URL
- `jwt.secret` - JWT secret key (change in production!)
- `jwt.expiration` - Token expiration time in milliseconds
- `cors.allowed-origins` - Allowed CORS origins

## Troubleshooting

### Port Already in Use
Change the port in `application.properties`:
```properties
server.port=8081
```

### Database Connection Issues
- Verify MySQL is running
- Check credentials in `application.properties`
- Ensure database exists

### JWT Token Issues
- Ensure `jwt.secret` is at least 256 bits (32 characters)
- Check token expiration settings
