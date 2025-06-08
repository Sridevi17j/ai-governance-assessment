# FINOS AI Governance Assessment - PDF Setup Instructions

## What's Changed

The application now generates **real PDF files** instead of HTML files that require manual conversion. When you click "Download PDF Report", it will directly create and download a professional PDF document.

## Installation Steps

### Option 1: Quick Setup (Recommended)
```bash
cd ai-governance-assessment
npm run setup
```

### Option 2: Manual Installation
```bash
cd ai-governance-assessment
npm run install:all
npm run install:pdf
```

### Option 3: Platform-Specific Scripts

**Windows:**
```bash
install-pdf-deps.bat
```

**Mac/Linux:**
```bash
chmod +x install-pdf-deps.sh
./install-pdf-deps.sh
```

## New Dependencies Added

- **jsPDF** (^2.5.1): Core PDF generation library
- **html2canvas** (^1.4.1): Converts HTML content to canvas for PDF rendering

## Features

✅ **Direct PDF Download**: No more manual HTML-to-PDF conversion  
✅ **Professional Formatting**: Clean, enterprise-ready layout  
✅ **Complete Data**: Includes product info, scores, analysis, and mitigations  
✅ **Auto-Naming**: Files named as `FINOS-AI-Assessment-[ProductName]-[Date].pdf`  
✅ **Multi-Page Support**: Handles long reports automatically  
✅ **Browser Compatibility**: Works in all modern browsers  

## How It Works

1. User completes assessment form
2. Results are displayed on screen
3. Clicking "Download PDF Report" triggers:
   - Creates temporary HTML container with report content
   - Uses html2canvas to convert to image
   - Uses jsPDF to create PDF from image
   - Automatically downloads the PDF file
   - Cleans up temporary elements

## Troubleshooting

**If PDF download fails:**
1. Check browser console for errors
2. Ensure both dependencies are installed
3. Try refreshing the page and running assessment again
4. Check if browser allows file downloads

**File not downloading:**
- Check browser's download settings
- Disable popup blockers
- Try a different browser

## File Structure

The PDF includes:
- **Header**: FINOS AI Governance Assessment Report
- **Product Information**: Name, manager details
- **Overall Score**: Compliance rating with visual indicator
- **Risk Assessment**: Individual risk scores and levels
- **Assessment Scope**: Which risks were evaluated
- **Risk Analysis**: Detailed AI-generated analysis
- **Risk Mitigations**: FINOS framework recommendations
- **Footer**: Generation date and framework information

## Development Notes

- PDF generation happens entirely client-side
- No server-side processing required
- Uses standard A4 page format
- Optimized for print and digital viewing
- Maintains professional appearance across different devices
