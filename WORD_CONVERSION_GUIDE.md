# Word Document Conversion Guide for Roo Code
**Australian Auto Parts Platform - Professional Documentation**

---

## Overview

This guide explains multiple methods to convert the project's Markdown documentation to professional Word documents (.docx) that can be emailed and opened on Windows.

---

## Method 1: Using Pandoc (Recommended - Automated)

### What is Pandoc?
Pandoc is a universal document converter that can transform Markdown to beautifully formatted Word documents with professional styling.

### Installation on Windows

**Option A: Direct Download**
1. Visit: https://pandoc.org/installing.html
2. Download the Windows installer (.msi)
3. Run installer and follow prompts
4. Restart PowerShell/Terminal

**Option B: Using Chocolatey**
```powershell
choco install pandoc
```

**Option C: Using winget**
```powershell
winget install --id JohnMacFarlane.Pandoc
```

### Usage

Once Pandoc is installed, run the provided script:

```powershell
# From project root
.\convert-to-word.ps1
```

This will automatically:
- ✅ Convert all 11 documentation files to Word
- ✅ Add professional formatting and styling
- ✅ Include automatic table of contents
- ✅ Add document metadata (title, date, subtitle)
- ✅ Number files for easy navigation
- ✅ Create in `word-documents/` folder

**Output Files:**
```
word-documents/
├── 01_PACKAGE_README.docx              (~50 KB)
├── 02_PROJECT_STATUS_REPORT.docx       (~120 KB)
├── 03_EXECUTIVE_SUMMARY.docx           (~30 KB)
├── 04_DEVELOPER_QUICKSTART.docx        (~40 KB)
├── 05_TECHNICAL_ARCHITECTURE.docx      (~200 KB)
├── 06_API_SPECIFICATION.docx           (~250 KB)
├── 07_UI_UX_DESIGN.docx                (~150 KB)
├── 08_BUSINESS_REQUIREMENTS.docx       (~100 KB)
├── 09_TECHNICAL_REQUIREMENTS.docx      (~80 KB)
├── 10_BACKEND_SETUP.docx               (~40 KB)
└── 11_PACKAGING_INSTRUCTIONS.docx      (~50 KB)

Total: ~1.1 MB (perfect for email)
```

---

## Method 2: Using Python with python-docx

### Setup

1. Install Python 3.8+ from https://www.python.org/downloads/
2. Install required packages:

```powershell
pip install python-docx markdown
```

### Script

<write_to_file>
<path>convert-to-word-python.py</path>
<content>
"""
Australian Auto Parts Platform - Markdown to Word Converter
Converts Markdown documentation to Word documents using python-docx
"""

import os
import markdown
from docx import Document
from docx.shared import Pt, RGBColor, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH
import re

# Files to convert
FILES_TO_CONVERT = [
    {"source": "PACKAGE_README.md", "output": "01_PACKAGE_README.docx", "title": "Package Navigation Guide"},
    {"source": "PROJECT_STATUS_REPORT.md", "output": "02_PROJECT_STATUS_REPORT.docx", "title": "Project Status Report"},
    {"source": "project.md", "output": "03_EXECUTIVE_SUMMARY.docx", "title": "Executive Summary"},
    {"source": "README.md", "output": "04_DEVELOPER_QUICKSTART.docx", "title": "Developer Quickstart"},
    {"source": "docs/ARCHITECTURE.md", "output": "05_TECHNICAL_ARCHITECTURE.docx", "title": "Technical Architecture"},
    {"source": "docs/API_DESIGN.md", "output": "06_API_SPECIFICATION.docx", "title": "API Specification"},
    {"source": "docs/UI_UX_DESIGN.md", "output": "07_UI_UX_DESIGN.docx", "title": "UI/UX Design System"},
    {"source": "requirements/business_requirements.md", "output": "08_BUSINESS_REQUIREMENTS.docx", "title": "Business Requirements"},
    {"source": "requirements/technical_requirements.md", "output": "09_TECHNICAL_REQUIREMENTS.docx", "title": "Technical Requirements"},
    {"source": "backend/README.md", "output": "10_BACKEND_SETUP.docx", "title": "Backend Setup Guide"},
    {"source": "HOW_TO_PACKAGE_AND_EMAIL.md", "output": "11_PACKAGING_INSTRUCTIONS.docx", "title": "Packaging Instructions"},
]

OUTPUT_FOLDER = "word-documents"

def create_title_page(doc, title):
    """Add a professional title page"""
    # Add title
    title_para = doc.add_paragraph()
    title_para.alignment = WD_ALIGN_PARAGRAPH.CENTER
    title_run = title_para.add_run(title)
    title_run.font.size = Pt(28)
    title_run.font.bold = True
    title_run.font.color.rgb = RGBColor(12, 77, 162)  # Deep blue
    
    # Add subtitle
    subtitle_para = doc.add_paragraph()
    subtitle_para.alignment = WD_ALIGN_PARAGRAPH.CENTER
    subtitle_run = subtitle_para.add_run("Australian Auto Parts Platform")
    subtitle_run.font.size = Pt(18)
    subtitle_run.font.color.rgb = RGBColor(102, 102, 102)
    
    # Add date
    import datetime
    date_para = doc.add_paragraph()
    date_para.alignment = WD_ALIGN_PARAGRAPH.CENTER
    date_run = date_para.add_run(datetime.datetime.now().strftime("%B %d, %Y"))
    date_run.font.size = Pt(12)
    date_run.font.color.rgb = RGBColor(102, 102, 102)
    
    # Add page break
    doc.add_page_break()

def parse_markdown_to_word(md_content, doc):
    """Convert Markdown content to Word document with styling"""
    lines = md_content.split('\n')
    
    for line in lines:
        line = line.rstrip()
        
        # Headers
        if line.startswith('# '):
            para = doc.add_heading(line[2:], level=1)
        elif line.startswith('## '):
            para = doc.add_heading(line[3:], level=2)
        elif line.startswith('### '):
            para = doc.add_heading(line[4:], level=3)
        elif line.startswith('#### '):
            para = doc.add_heading(line[5:], level=4)
        
        # Code blocks
        elif line.startswith('```'):
            continue  # Skip code fence markers
        
        # Bullet lists
        elif line.startswith('- ') or line.startswith('* '):
            para = doc.add_paragraph(line[2:], style='List Bullet')
        
        # Numbered lists
        elif re.match(r'^\d+\. ', line):
            text = re.sub(r'^\d+\. ', '', line)
            para = doc.add_paragraph(text, style='List Number')
        
        # Bold text (simple detection)
        elif '**' in line:
            para = doc.add_paragraph()
            parts = line.split('**')
            for i, part in enumerate(parts):
                run = para.add_run(part)
                if i % 2 == 1:  # Odd indices are bold
                    run.font.bold = True
        
        # Regular paragraphs
        elif line.strip():
            doc.add_paragraph(line)

def convert_file(source_path, output_path, title):
    """Convert a single Markdown file to Word"""
    print(f"Converting: {title}...")
    
    try:
        # Read Markdown file
        with open(source_path, 'r', encoding='utf-8') as f:
            md_content = f.read()
        
        # Create Word document
        doc = Document()
        
        # Add title page
        create_title_page(doc, title)
        
        # Convert content
        parse_markdown_to_word(md_content, doc)
        
        # Save document
        doc.save(output_path)
        
        # Get file size
        size_kb = os.path.getsize(output_path) / 1024
        print(f"✓ Created: {os.path.basename(output_path)} ({size_kb:.1f} KB)")
        return True
        
    except Exception as e:
        print(f"❌ Error converting {source_path}: {str(e)}")
        return False

def main():
    """Main conversion function"""
    print("")
    print("=" * 50)
    print(" Australian Auto Parts Platform")
    print(" Markdown to Word Conversion (Python)")
    print("=" * 50)
    print("")
    
    # Create output folder
    if not os.path.exists(OUTPUT_FOLDER):
        os.makedirs(OUTPUT_FOLDER)
        print(f"✓ Created folder: {OUTPUT_FOLDER}")
    else:
        print(f"✓ Output folder exists")
    
    print("")
    print("Converting files...")
    print("")
    
    success_count = 0
    fail_count = 0
    
    for file_info in FILES_TO_CONVERT:
        source_path = file_info["source"]
        output_path = os.path.join(OUTPUT_FOLDER, file_info["output"])
        title = file_info["title"]
        
        if not os.path.exists(source_path):
            print(f"⚠ Skipping: {source_path} (not found)")
            fail_count += 1
            continue
        
        if convert_file(source_path, output_path, title):
            success_count += 1
        else:
            fail_count += 1
    
    print("")
    print("=" * 50)
    print(" CONVERSION COMPLETE")
    print("=" * 50)
    print("")
    print(f"✓ Successfully converted: {success_count} files")
    if fail_count > 0:
        print(f"❌ Failed: {fail_count} files")
    print("")
    print(f"Output Location: {os.path.abspath(OUTPUT_FOLDER)}")
    print("")
    print("Conversion complete! ✨")

if __name__ == "__main__":
    main()