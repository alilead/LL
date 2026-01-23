#!/usr/bin/env python3
"""
Clean Python files by removing null bytes and ensuring UTF-8 encoding.
This script should be run before deployment to fix any file corruption issues.
"""
import os
import sys

def clean_file(filepath):
    """Remove null bytes from a file and ensure UTF-8 encoding."""
    try:
        # Read file in binary mode
        with open(filepath, 'rb') as f:
            content = f.read()
        
        # Check for null bytes
        if b'\x00' in content:
            print(f"⚠️  Found null bytes in {filepath}, cleaning...")
            # Remove null bytes
            content = content.replace(b'\x00', b'')
            
            # Write back
            with open(filepath, 'wb') as f:
                f.write(content)
            print(f"✅ Cleaned {filepath}")
            return True
        return False
    except Exception as e:
        print(f"❌ Error processing {filepath}: {e}")
        return False

def clean_directory(directory):
    """Clean all Python files in a directory recursively."""
    cleaned_count = 0
    for root, dirs, files in os.walk(directory):
        # Skip __pycache__ directories
        dirs[:] = [d for d in dirs if d != '__pycache__']
        
        for file in files:
            if file.endswith('.py'):
                filepath = os.path.join(root, file)
                if clean_file(filepath):
                    cleaned_count += 1
    
    return cleaned_count

if __name__ == '__main__':
    # Clean the app directory
    app_dir = os.path.join(os.path.dirname(__file__), 'app')
    if os.path.exists(app_dir):
        print(f"Cleaning Python files in {app_dir}...")
        cleaned = clean_directory(app_dir)
        if cleaned > 0:
            print(f"✅ Cleaned {cleaned} file(s)")
            sys.exit(0)
        else:
            print("✅ No files needed cleaning")
            sys.exit(0)
    else:
        print(f"❌ Directory {app_dir} not found")
        sys.exit(1)
