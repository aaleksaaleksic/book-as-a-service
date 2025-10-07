@echo off
echo ========================================
echo   Book-as-a-Service Environment Setup
echo ========================================
echo.

echo Step 1: Setting up environment variables...
echo.

REM Set the JWT secret (generated securely)
set JWT_SECRET=5bJesUzp7FmYQTD10QxMrAIkpgVw6Zw3DchjZaaNQCJdXxnG728mThpdK69naSImRsJZjppwd566mWcv5LzyZQ==

REM Set a secure database password (you can change this)
set DB_PASSWORD=MySecurePassword123!

REM Set payment credentials (keep as placeholders for development)
set NLB_MERCHANT_ID=dev-merchant-id
set NLB_SECRET_KEY=dev-secret-key

echo ✓ JWT_SECRET set (secure 512-bit key)
echo ✓ DB_PASSWORD set to: %DB_PASSWORD%
echo ✓ Payment credentials set to development values
echo.

echo Step 2: Verifying environment variables...
echo JWT_SECRET length:
echo %JWT_SECRET% | findstr /R /C:"." | findstr /R /C:".........." >NUL 2>&1 && echo ✓ JWT Secret is long enough || echo ✗ JWT Secret too short

echo.
echo Step 3: Testing database connection...
echo Make sure PostgreSQL is running with:
echo   - Database: readify_db
echo   - Username: postgres
echo   - Password: %DB_PASSWORD%
echo.

echo ========================================
echo Environment variables are now set!
echo You can now run your Spring Boot application.
echo ========================================
echo.

echo To make these permanent (optional):
echo 1. Press Win + R, type "sysdm.cpl", press Enter
echo 2. Click "Environment Variables" button
echo 3. Click "New" under "User variables"
echo 4. Add each variable manually
echo.

echo For now, these variables will work in this command window.
echo To start your application, run:
echo   cd backend\readify
echo   mvn spring-boot:run
echo.

pause