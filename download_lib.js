#!/usr/bin/env node

/**
 * Script to download PDF.js library files
 * Usage: node download_lib.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const LIB_DIR = 'lib';
const PDFJS_VERSION = '4.0.379'; // Update this to the latest version

// Alternative CDN URLs
const CDN_URLS = {
  pdfjs: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.min.js`,
  worker: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.js`
};

// Alternative: Use unpkg.com
// const CDN_URLS = {
//   pdfjs: `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/build/pdf.min.js`,
//   worker: `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.js`
// };

function downloadFile(url, outputPath) {
  return new Promise((resolve, reject) => {
    console.log(`Downloading ${path.basename(outputPath)}...`);
    
    const file = fs.createWriteStream(outputPath);
    
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode} ${response.statusMessage}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        const stats = fs.statSync(outputPath);
        console.log(`✅ Downloaded ${path.basename(outputPath)} (${(stats.size / 1024).toFixed(2)} KB)`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlinkSync(outputPath);
      reject(err);
    });
  });
}

async function main() {
  try {
    // Create lib directory if it doesn't exist
    if (!fs.existsSync(LIB_DIR)) {
      fs.mkdirSync(LIB_DIR, { recursive: true });
      console.log(`Created ${LIB_DIR} directory`);
    }
    
    console.log(`Downloading PDF.js version ${PDFJS_VERSION}...\n`);
    
    // Download both files
    await downloadFile(CDN_URLS.pdfjs, path.join(LIB_DIR, 'pdf.min.js'));
    await downloadFile(CDN_URLS.worker, path.join(LIB_DIR, 'pdf.worker.min.js'));
    
    console.log('\n✅ Successfully downloaded all PDF.js library files!');
    console.log(`Files are located in: ${path.resolve(LIB_DIR)}`);
    
  } catch (error) {
    console.error('❌ Error downloading files:', error.message);
    process.exit(1);
  }
}

main();
