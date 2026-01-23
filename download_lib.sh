#!/bin/bash

# Script to download PDF.js library files
# This downloads the latest stable version of PDF.js from Mozilla's CDN

set -e

LIB_DIR="lib"
PDFJS_VERSION="4.0.379"  # You can update this to the latest version

echo "Downloading PDF.js library files..."
echo "Version: $PDFJS_VERSION"

# Create lib directory if it doesn't exist
mkdir -p "$LIB_DIR"

# Download pdf.min.js
echo "Downloading pdf.min.js..."
curl -L "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.min.js" \
  -o "${LIB_DIR}/pdf.min.js"

# Download pdf.worker.min.js
echo "Downloading pdf.worker.min.js..."
curl -L "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.js" \
  -o "${LIB_DIR}/pdf.worker.min.js"

echo "✅ Successfully downloaded PDF.js library files to ${LIB_DIR}/"
echo "Files:"
ls -lh "${LIB_DIR}/"*.js
