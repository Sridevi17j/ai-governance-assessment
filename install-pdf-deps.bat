@echo off
echo Installing PDF generation dependencies...
cd apps\web
npm install jspdf@^2.5.1 html2canvas@^1.4.1
echo PDF dependencies installed successfully!
echo You can now run the application with proper PDF download functionality.
pause
