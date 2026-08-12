@echo off
echo ============================================
echo   SMS - Starting Server from d:\SMS
echo ============================================
cd /d d:\SMS
echo.
echo [1/3] Checking node_modules...
if not exist "backend\node_modules" (
    echo Installing backend dependencies...
    cd backend
    call npm install
    cd ..
)

echo [2/3] Starting backend server on port 5000...
echo [2/3] Open browser at: http://localhost:5000
echo.
node backend\server.js
pause