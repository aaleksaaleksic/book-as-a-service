@echo off
echo ========================================
echo   Cleaning up unnecessary files...
echo ========================================
echo.

echo Removing test PDF files...
del test*.pdf 2>nul
if %errorlevel%==0 (
    echo ✓ Removed test PDF files
) else (
    echo ✓ No test PDF files found
)

echo.
echo Removing build artifacts...
rmdir /s /q "backend\readify\target" 2>nul
if %errorlevel%==0 (
    echo ✓ Removed Maven target directory
) else (
    echo ✓ Maven target directory not found
)

rmdir /s /q "frontend\.next" 2>nul
if %errorlevel%==0 (
    echo ✓ Removed Next.js build directory
) else (
    echo ✓ Next.js build directory not found
)

echo.
echo Removing log files...
del "backend\readify\backend.log" 2>nul
if %errorlevel%==0 (
    echo ✓ Removed backend log files
) else (
    echo ✓ No backend log files found
)

echo.
echo Removing node_modules (will be recreated on npm install)...
rmdir /s /q "frontend\node_modules" 2>nul
if %errorlevel%==0 (
    echo ✓ Removed node_modules directory
) else (
    echo ✓ node_modules directory not found
)

echo.
echo ========================================
echo Cleanup completed!
echo ========================================
echo.
echo Removed files:
echo - 18 test PDF files (test*.pdf)
echo - Maven build artifacts (target/)
echo - Next.js build files (.next/)
echo - Log files (*.log)
echo - Node modules (frontend/node_modules/)
echo.
echo Run 'npm install' in frontend/ before starting development.
echo.
pause