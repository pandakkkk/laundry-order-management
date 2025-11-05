# 🔐 Authentication Guide

## Overview

Your Laundry Order Monitoring System now has complete authentication and authorization using JWT (JSON Web Tokens). Only authenticated users can access the dashboard.

## Features

✅ **Email & Password Authentication**
- Email as username
- Password minimum 6 characters
- Secure password hashing with bcryptjs
- JWT token-based sessions (7 days expiry)

✅ **User Roles**
- **Admin**: Full access
- **Manager**: Can manage orders and staff
- **Staff**: Can view and update orders

✅ **Security Features**
- Passwords are hashed before storage
- JWT tokens for session management
- Protected API routes
- Auto-logout on token expiration
- Frontend route protection

✅ **User Management**
- User registration
- User login
- Profile viewing
- Password change
- Account deactivation

## Quick Start

### 1. Create Your First Admin User

```bash
npm run create-admin
```

Follow the prompts:
- **Email**: admin@laundry.com
- **Name**: Admin User
- **Password**: admin123 (or your choice, min 6 chars)

### 2. Start the Application

```bash
npm run dev
```

### 3. Login

1. Open http://localhost:3000
2. You'll be redirected to `/login`
3. Enter your credentials
4. Access the dashboard!

## User Registration

### Via UI
1. Go to http://localhost:3000/login
2. Click "Create one" to switch to registration
3. Fill in:
   - Name
   - Email
   - Password (min 6 characters)
   - Confirm Password
4. Click "Create Account"

### Via API

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "staff@laundry.com",
    "password": "staff123",
    "name": "Staff Member",
    "role": "staff"
  }'
```

## Login

### Via UI
1. Go to http://localhost:3000/login
2. Enter email and password
3. Click "Sign In"

### Via API

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@laundry.com",
    "password": "admin123"
  }'
```

Response:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "email": "admin@laundry.com",
    "name": "Admin User",
    "role": "admin"
  }
}
```

## Using the Dashboard

Once logged in:
1. **Header displays** your name and role
2. **Create orders** with the "+ New Order" button
3. **View/update orders** in the dashboard
4. **Logout** using the "Logout" button

## API Authentication

All order API endpoints now require authentication. Include the JWT token in requests:

```bash
# Get orders
curl -X GET http://localhost:5000/api/orders \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Create order
curl -X POST http://localhost:5000/api/orders \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{...order data...}'
```

## API Endpoints

### Authentication

| Method | Endpoint | Description | Public |
|--------|----------|-------------|--------|
| POST | `/api/auth/register` | Create new user | ✅ |
| POST | `/api/auth/login` | Login user | ✅ |
| GET | `/api/auth/me` | Get current user | 🔒 |
| POST | `/api/auth/logout` | Logout user | 🔒 |
| POST | `/api/auth/change-password` | Change password | 🔒 |

### Orders (All Protected 🔒)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/orders` | Get all orders |
| GET | `/api/orders/:id` | Get order by ID |
| POST | `/api/orders` | Create order |
| PUT | `/api/orders/:id` | Update order |
| PATCH | `/api/orders/:id/status` | Update status |
| DELETE | `/api/orders/:id` | Delete order |
| GET | `/api/orders/stats/summary` | Get statistics |
| GET | `/api/orders/search/query` | Search orders |

## Password Requirements

- ✅ Minimum 6 characters
- ✅ No maximum length
- ✅ Any characters allowed (letters, numbers, symbols)
- ✅ Case sensitive

## Token Management

### Token Storage
- Frontend: `localStorage` (key: `token`)
- Expiry: 7 days (configurable in `.env`)

### Token Refresh
- Tokens are valid for 7 days
- After expiry, user must login again
- No auto-refresh implemented (can be added)

### Logout
- Removes token from localStorage
- Clears axios default headers
- Redirects to login page

## Security Best Practices

### For Production

1. **Change JWT_SECRET** in `.env`:
```env
JWT_SECRET=your-very-long-random-secret-key-here
```

2. **Use HTTPS** in production

3. **Environment Variables**:
```env
NODE_ENV=production
JWT_SECRET=<strong-random-secret>
JWT_EXPIRE=7d
```

4. **Rate Limiting**: Add rate limiting to login endpoint

5. **Password Policies**: 
   - Consider stronger password requirements
   - Add password complexity rules
   - Implement password reset functionality

## User Roles

### Admin
- Full system access
- Can manage users (future feature)
- Can view all orders
- Can modify any order

### Manager
- Can view all orders
- Can update order statuses
- Can create orders
- Cannot manage users

### Staff
- Can view orders
- Can update order statuses
- Can create orders
- Limited access

## Troubleshooting

### "Invalid credentials" error
- Check email and password are correct
- Passwords are case-sensitive
- Ensure user account exists

### "Not authorized" error
- Token may be expired (login again)
- Token may be invalid
- User account may be deactivated

### Can't create admin user
- Ensure MongoDB is running
- Check if user already exists
- Verify email format is valid

### Token expires too quickly
- Increase `JWT_EXPIRE` in `.env`
- Default is 7 days (`7d`)
- Options: `1h`, `24h`, `7d`, `30d`

## Future Enhancements

Potential additions:
- [ ] Password reset via email
- [ ] Two-factor authentication (2FA)
- [ ] Remember me functionality
- [ ] Token refresh mechanism
- [ ] User management interface
- [ ] Activity logs
- [ ] Session management
- [ ] Social login (Google, Facebook)
- [ ] API key authentication for integrations

## Configuration

### Environment Variables

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/laundry-orders

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRE=7d
```

### JWT Secret Generation

Generate a strong JWT secret:

```bash
# Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# OpenSSL
openssl rand -hex 64
```

---

**🔒 Your laundry dashboard is now secure!**

Only authenticated users can access orders and manage the system.

