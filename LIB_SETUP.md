# PDF.js Library Setup

This guide explains how to download/update the PDF.js library files required for the extension.

## Quick Start

You have three options to download the PDF.js library files:

### Option 1: Using Node.js (Recommended)
```bash
npm run download-lib
# or
node download_lib.js
```

### Option 2: Using Python
```bash
npm run download-lib-py
# or
python3 download_lib.py
```

### Option 3: Using Bash
```bash
npm run download-lib-sh
# or
bash download_lib.sh
```

## What Gets Downloaded

The scripts download the following files to the `lib/` directory:

- `pdf.min.js` - Main PDF.js library (minified)
- `pdf.worker.min.js` - PDF.js worker file (minified)

## Updating the Version

To update to a newer version of PDF.js:

1. Check the latest version at: https://github.com/mozilla/pdf.js/releases
2. Update the `PDFJS_VERSION` variable in the download script(s)
3. Run the download script again

Current version in scripts: `4.0.379`

## Manual Download

If the scripts don't work, you can manually download from:

- **CDN (Cloudflare)**: 
  - https://cdnjs.cloudflare.com/ajax/libs/pdf.js/{VERSION}/pdf.min.js
  - https://cdnjs.cloudflare.com/ajax/libs/pdf.js/{VERSION}/pdf.worker.min.js

- **Alternative (unpkg)**:
  - https://unpkg.com/pdfjs-dist@{VERSION}/build/pdf.min.js
  - https://unpkg.com/pdfjs-dist@{VERSION}/build/pdf.worker.min.js

Replace `{VERSION}` with the desired PDF.js version (e.g., `4.0.379`).

## Verification

After downloading, verify the files exist:

```bash
ls -lh lib/
```

You should see:
- `pdf.min.js` (~280 KB)
- `pdf.worker.min.js` (~1 MB)

## Troubleshooting

### Network Issues
- Ensure you have internet connectivity
- Check if your firewall/proxy is blocking the CDN
- Try using a different CDN (unpkg.com) by modifying the script

### Permission Errors
- Make sure the `lib/` directory is writable
- On Linux/Mac, you may need `sudo` (not recommended)

### File Not Found
- Ensure the PDF.js version exists
- Check the version number in the script matches a released version

## Notes

- The lib files are already included in the repository
- You only need to run these scripts if you want to update to a newer version
- The `.gitignore` file has these files commented out, meaning they are tracked in git
