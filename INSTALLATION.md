# Installation Guide

## Quick Start

### Step 1: Download the Extension
1. Download or clone this repository to your computer
2. Extract the files if needed

### Step 2: Install in Chrome

1. **Open Chrome Extensions Page**
   - Open Google Chrome
   - Navigate to `chrome://extensions/`
   - Or go to: Menu (⋮) → Extensions → Manage Extensions

2. **Enable Developer Mode**
   - Toggle the "Developer mode" switch in the top-right corner

3. **Load the Extension**
   - Click the "Load unpacked" button
   - Select the `form-filler` folder (the one containing `manifest.json`)
   - The extension should now appear in your extensions list

4. **Verify Installation**
   - Look for the extension icon in your Chrome toolbar
   - If you don't see it, click the puzzle piece icon (🧩) to access extensions

### Step 3: First Use

1. **Navigate to the Form**
   - Go to: `https://hrnextgeninfohub.com/task-form?id=<uuid>`
   - Wait for the form to fully load

2. **Upload PDF**
   - Click the extension icon in your toolbar
   - Click "Upload PDF"
   - Select your biodata PDF file
   - Wait for parsing to complete (you'll see a success message)

3. **Fill the Form**
   - Click the "Fill Form" button
   - Watch as fields are automatically filled
   - Review the filled form
   - Submit if needed

## Troubleshooting

### Extension Not Loading
- Ensure you selected the correct folder (the one with `manifest.json`)
- Check that all files are present (manifest.json, popup.html, etc.)
- Look for error messages in the Extensions page

### PDF Not Parsing
- Ensure the PDF contains text (not just scanned images)
- Try opening the PDF in a PDF viewer to verify it has selectable text
- Check the browser console (F12) for error messages

### Form Not Filling
- Verify you're on the correct URL pattern
- Ensure the form has fully loaded (wait a few seconds)
- Check browser console (F12) for error messages
- Some fields may need manual adjustment if selectors don't match

### Fields Not Matching
- The extension uses intelligent matching, but some forms may have different field names
- Check the browser console to see which fields were found/not found
- You can customize field mappings in `content.js` if needed

## Requirements

- **Chrome Version**: 88 or higher (Manifest V3 support)
- **PDF Format**: Text-based PDF (not scanned images)
- **Internet**: Required only for initial PDF.js library download (if not included)

## Uninstallation

1. Go to `chrome://extensions/`
2. Find "PDF to Web Form Autofill"
3. Click "Remove"
4. Confirm removal

## Updating the Extension

1. Download the latest version
2. Go to `chrome://extensions/`
3. Click the refresh icon (🔄) on the extension card
4. Or remove and reinstall if needed

## Security Note

This extension:
- ✅ Processes all data locally on your computer
- ✅ Does not send data to external servers
- ✅ Only works on the specified domain (hrnextgeninfohub.com)
- ✅ Requires explicit permission to access the form page

Your PDF data never leaves your browser!

