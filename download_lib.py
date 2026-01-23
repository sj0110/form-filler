#!/usr/bin/env python3

"""
Script to download PDF.js library files
Usage: python3 download_lib.py
"""

import os
import urllib.request
import sys

LIB_DIR = 'lib'
PDFJS_VERSION = '4.0.379'  # Update this to the latest version

# CDN URLs
CDN_URLS = {
    'pdfjs': f'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/{PDFJS_VERSION}/pdf.min.js',
    'worker': f'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/{PDFJS_VERSION}/pdf.worker.min.js'
}

# Alternative: Use unpkg.com
# CDN_URLS = {
#     'pdfjs': f'https://unpkg.com/pdfjs-dist@{PDFJS_VERSION}/build/pdf.min.js',
#     'worker': f'https://unpkg.com/pdfjs-dist@{PDFJS_VERSION}/build/pdf.worker.min.js'
# }


def download_file(url, output_path):
    """Download a file from URL to output path"""
    print(f'Downloading {os.path.basename(output_path)}...')
    
    try:
        urllib.request.urlretrieve(url, output_path)
        file_size = os.path.getsize(output_path)
        print(f'✅ Downloaded {os.path.basename(output_path)} ({file_size / 1024:.2f} KB)')
    except Exception as e:
        print(f'❌ Error downloading {os.path.basename(output_path)}: {e}')
        sys.exit(1)


def main():
    # Create lib directory if it doesn't exist
    if not os.path.exists(LIB_DIR):
        os.makedirs(LIB_DIR, exist_ok=True)
        print(f'Created {LIB_DIR} directory')
    
    print(f'Downloading PDF.js version {PDFJS_VERSION}...\n')
    
    # Download both files
    download_file(CDN_URLS['pdfjs'], os.path.join(LIB_DIR, 'pdf.min.js'))
    download_file(CDN_URLS['worker'], os.path.join(LIB_DIR, 'pdf.worker.min.js'))
    
    print('\n✅ Successfully downloaded all PDF.js library files!')
    print(f'Files are located in: {os.path.abspath(LIB_DIR)}')


if __name__ == '__main__':
    main()
