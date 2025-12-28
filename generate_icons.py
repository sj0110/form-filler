#!/usr/bin/env python3
"""
Simple script to generate extension icons
Requires PIL/Pillow: pip install Pillow
"""

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    print("Pillow not installed. Installing...")
    import subprocess
    subprocess.check_call(["pip", "install", "Pillow"])
    from PIL import Image, ImageDraw, ImageFont

def create_icon(size, filename):
    # Create image with gradient background
    img = Image.new('RGB', (size, size), color='#667eea')
    draw = ImageDraw.Draw(img)
    
    # Draw a simple form/document icon
    # Draw a rectangle (document)
    margin = size // 6
    doc_width = size - 2 * margin
    doc_height = size - 2 * margin
    draw.rectangle([margin, margin, margin + doc_width, margin + doc_height], 
                   fill='white', outline='#764ba2', width=2)
    
    # Draw lines (form fields)
    line_spacing = doc_height // 8
    for i in range(3, 7):
        y = margin + i * line_spacing
        draw.line([margin + 10, y, margin + doc_width - 10, y], 
                 fill='#667eea', width=2)
    
    # Draw a checkmark
    check_size = size // 4
    check_x = size - margin - check_size
    check_y = margin
    draw.line([check_x, check_y + check_size//2, 
               check_x + check_size//3, check_y + check_size],
             fill='#4caf50', width=4)
    draw.line([check_x + check_size//3, check_y + check_size,
               check_x + check_size, check_y],
             fill='#4caf50', width=4)
    
    img.save(filename)
    print(f"Created {filename} ({size}x{size})")

if __name__ == '__main__':
    import os
    os.makedirs('icons', exist_ok=True)
    
    create_icon(16, 'icons/icon16.png')
    create_icon(48, 'icons/icon48.png')
    create_icon(128, 'icons/icon128.png')
    
    print("Icons generated successfully!")

