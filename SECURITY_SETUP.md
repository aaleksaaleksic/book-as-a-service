# Security Setup Guide

## ⚠️ CRITICAL: Environment Variables Setup

Before running the application, you **MUST** set up secure environment variables.

### 1. Backend Environment Setup

1. Copy the example environment file:
   ```bash
   cd backend/readify
   cp .env.example .env
   ```

2. **Generate a secure JWT secret** (256 bits minimum):
   ```bash
   # Option 1: Using OpenSSL
   openssl rand -base64 64

   # Option 2: Using Node.js
   node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
   ```

3. **Set environment variables**:
   ```bash
   # Set JWT secret
   export JWT_SECRET="your_generated_jwt_secret_here"

   # Set database password
   export DB_PASSWORD="your_secure_database_password"

   # Set payment credentials (if using real payments)
   export NLB_MERCHANT_ID="your_real_merchant_id"
   export NLB_SECRET_KEY="your_real_secret_key"
   ```

### 2. Frontend Environment Setup

1. Copy the example environment file:
   ```bash
   cd frontend
   cp .env.example .env
   ```

2. Update `NEXT_PUBLIC_API_URL` if needed for your environment.

### 3. Production Deployment

For production environments:

1. **Never use the default values** from `.env.example`
2. **Use a secrets management service** (AWS Secrets Manager, Azure Key Vault, etc.)
3. **Set environment variables** through your deployment platform
4. **Enable HTTPS** and update CORS origins accordingly
5. **Use strong database credentials** and restrict database access

### 4. Security Checklist

- [ ] JWT secret is randomly generated and 256+ bits
- [ ] Database credentials are secure and not default values
- [ ] `.env` files are in `.gitignore` and not committed to git
- [ ] Production uses HTTPS
- [ ] CORS origins are restricted to your domains
- [ ] File upload limits are appropriate for your use case
- [ ] Rate limiting is enabled in production

### 5. Quick Security Test

After setup, verify security:

```bash
# Check that secrets are not in git history
git log --all --grep="password\|secret\|key" --oneline

# Verify environment variables are loaded
echo $JWT_SECRET | wc -c  # Should be > 50 characters
```

## 🚨 Security Issues Fixed

This setup resolves these critical vulnerabilities:

1. **Hardcoded JWT Secret** - Now uses environment variables
2. **Hardcoded Database Password** - Now uses environment variables
3. **Missing Input Validation** - Added DTOs with validation annotations
4. **Git Security** - Added `.env` files to `.gitignore`

## 📞 Support

If you encounter security issues, please report them responsibly through private channels.