# Quick Start Guide

## 🚀 Get Started in 3 Steps

### Step 1: Install Extension (2 minutes)

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select the `form-filler` folder
5. ✅ Extension installed!

### Step 2: Use the Extension (1 minute)

1. Navigate to: `https://hrnextgeninfohub.com/task-form?id=<uuid>`
2. Click the extension icon in your toolbar
3. Click **Upload PDF** and select your biodata PDF
4. Wait for "PDF parsed successfully!" message
5. Click **Fill Form**
6. ✅ Form automatically filled!

### Step 3: Review & Submit

- Review all filled fields
- Make any manual adjustments if needed
- Submit the form

## 💡 Tips

- **PDF Format**: Make sure your PDF has selectable text (not just scanned images)
- **Form Loading**: Wait a few seconds after the page loads before clicking "Fill Form"
- **Field Matching**: If a dropdown doesn't match, it will automatically select "Other"
- **Dynamic Fields**: Email and Password are auto-generated from your PDF data

## 🆘 Troubleshooting

**Extension not working?**
- Check browser console (F12) for errors
- Ensure you're on the correct URL
- Verify PDF has extractable text

**Fields not filling?**
- Some fields may need manual adjustment
- Check the browser console for which fields were found
- Form layout might be different - update selectors in `content.js` if needed

## 📧 Generated Fields

The extension automatically creates:
- **Email**: `{FormNumber}_{Name}@nitresearchcenter.com`
- **Password**: `{FirstName}@1234`
- **How To Know About Us**: "My Friend"

Example:
- Form Number: 1, Name: Nakul Goyal
- Email: `1_NakulGoyal@nitresearchcenter.com`
- Password: `Nakul@1234`

---

**Need more help?** See [INSTALLATION.md](INSTALLATION.md) for detailed instructions.

