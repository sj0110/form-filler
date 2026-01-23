# PDF to Web Form Autofill - Chrome Extension

A Chrome extension that extracts structured data from PDF biodata files and automatically fills web forms, even when copy-paste is disabled.

## Features

- 📄 **PDF Parsing**: Extracts text and structured data from PDF biodata files
- 🔄 **Smart Field Mapping**: Automatically maps PDF data to corresponding form fields
- 📋 **Dropdown Handling**: Intelligently matches dropdown values or selects "Other" if no match
- ⚡ **Dynamic Field Generation**: Auto-generates email, password, and other required fields
- 🎯 **Form Interaction**: Fills both text inputs and dropdowns in real-time
- ✅ **Error Handling**: Graceful handling of missing fields and mismatched data

## Installation

### From Source (Developer Mode)

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top-right corner)
4. Click "Load unpacked"
5. Select the `form-filler` directory
6. The extension icon should appear in your Chrome toolbar

## Usage

1. **Navigate to the form page**: Open the web form at `https://hrnextgeninfohub.com/task-form?id=<uuid>`
2. **Click the extension icon** in your Chrome toolbar
3. **Upload PDF**: Click "Upload PDF" and select your biodata PDF file
4. **Fill Form**: Once the PDF is parsed, click "Fill Form" to automatically fill all fields
5. **Review and Submit**: Review the filled form and submit if needed

## How It Works

### PDF Parsing
- Uses PDF.js library to extract text from PDF files
- Parses structured data using pattern matching
- Extracts fields like Name, Age, Education, Occupation, etc.

### Field Mapping
The extension maps PDF data to form fields:
- **Text Fields**: Direct mapping (Name → Name field)
- **Dropdowns**: Smart matching with fallback to "Other"
- **Dynamic Fields**: Auto-generated based on PDF data

### Dynamic Field Generation

- **Email**: `{FormNumber}_{Name}@nitresearchcenter.com`
  - Example: `1_NakulGoyal@nitresearchcenter.com`
  
- **Retype Email**: Same as Email

- **Password**: `{FirstName}@1234`
  - Example: `Nakul@1234`
  
- **Retype Password**: Same as Password

- **How To Know About Us**: Always set to "My Friend"

## Field Mapping

The extension supports mapping for all common biodata fields:

### Personal Information
- Name, Age, Gender, Marital Status
- Education, Education Detail, Occupation

### Physical Attributes
- Height (Feet, Inches, Cms)
- Weight (Kg, Lbs)
- Body Type, Complexion, Physical Status

### Background
- Religion, Caste, Sub Caste, Gothram
- Mother Tongue, Star, Horoscope Match
- Dhosham/Manglik, Rassi/Moon Sign

### Location
- Home State, Country Living In
- State City Living In, Citizenship

### Habits & Preferences
- Eating Habit, Smoking Habit, Drinking Habit
- Family Value, Family Status, Family Type
- Annual Income

### Text Sections
- More About Self
- Your Expectation
- About Parents Siblings

## Technical Details

### Architecture
- **Manifest V3**: Uses latest Chrome Extension API
- **PDF.js**: Modern PDF parsing library
- **Content Scripts**: Injected into target pages for form interaction
- **Background Service Worker**: Handles PDF parsing

### Browser Compatibility
- Chrome 88+ (Manifest V3 support)
- Edge 88+ (Chromium-based)

### Security
- All processing happens locally
- No data transmission to external servers
- No external API calls
- Works entirely offline after installation

## Development

### Project Structure
```
form-filler/
├── manifest.json          # Extension manifest
├── popup.html            # Extension popup UI
├── popup.css             # Popup styles
├── popup.js              # Popup logic
├── background.js         # Service worker for PDF parsing
├── content.js            # Content script for form filling
├── lib/                  # PDF.js library files
│   ├── pdf.min.js
│   └── pdf.worker.min.js
├── icons/                # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md
```

### Customization

To customize field mappings, edit the `getFieldMappings()` function in `content.js`:

```javascript
function getFieldMappings() {
  return {
    name: { 
      type: 'text', 
      selector: 'input[name*="Name"]' 
    },
    // Add more mappings...
  };
}
```

## Troubleshooting

### PDF Not Parsing
- Ensure the PDF contains text (not just images)
- Check browser console for errors
- Try a different PDF file

### Fields Not Filling
- Verify you're on the correct form page
- Check that form fields are loaded (wait a few seconds)
- Review browser console for selector issues
- Some forms may use different field names - update selectors in `content.js`

### Dropdown Not Matching
- The extension will select "Other" if no exact match is found
- Check the dropdown options in the form
- Update the options array in field mappings if needed

## Limitations

- PDF must contain extractable text (scanned images won't work without OCR)
- Form field selectors may need adjustment for different form layouts
- Some dynamic forms may require additional wait time
- Copy-paste disabled forms are supported, but some forms may have additional protections

## License

This project is provided as-is for educational and personal use.

## Support

For issues or questions:
1. Check the browser console for error messages
2. Verify PDF format and content
3. Ensure form page is fully loaded
4. Review field mappings in `content.js`

## Version History

- **v1.0.0**: Initial release
  - PDF parsing with PDF.js
  - Form field mapping
  - Dropdown handling
  - Dynamic field generation
