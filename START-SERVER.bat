@echo off
cd /d "%~dp0"
echo.
echo  Forecourt Works — SR / Quotation / WO Registers
echo  Open in browser:  http://localhost:8080
echo  Press Ctrl+C to stop the server.
echo.
python -m http.server 8080
pause
