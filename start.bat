@echo off
echo 🚀 Starting TripCraft Backend...
echo.

REM Check if virtual environment exists
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
    echo Virtual environment created!
    echo.
)

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate

REM Install requirements if needed
if not exist "venv\Lib\site-packages\fastapi" (
    echo Installing dependencies...
    pip install -r requirements.txt
    echo Dependencies installed!
    echo.
)

REM Start the server using PORT from .env file (8005)
echo Starting server...
echo 🚀 Starting TripCraft Backend...
echo 📍 Server will run on http://0.0.0.0:8005
echo 📚 API Documentation: http://0.0.0.0:8005/docs
echo 🔍 Health Check: http://0.0.0.0:8005/health
echo ==================================================
uvicorn main:app --reload --host 0.0.0.0 --port 8005

pause