#!/usr/bin/env python3
"""
Master database runner — compiles the comprehensive university database
for all supported countries (Germany, USA, UK, Canada, Australia, Netherlands,
Sweden, France, Switzerland, Japan) covering all available universities in English.
"""
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from scrapers.generate_comprehensive_data import main as generate_main

def main():
    print("Executing master database runner...")
    generate_main()

if __name__ == "__main__":
    main()
