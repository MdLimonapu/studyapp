#!/usr/bin/env python3
"""
Master scraper runner — scrapes university courses for all supported countries.

Usage:
    python run_all.py                    # Scrape all countries
    python run_all.py germany            # Scrape Germany only
    python run_all.py usa canada uk      # Scrape specific countries
    python run_all.py --list             # List available countries
    python run_all.py --status           # Show data file status
"""
import sys
import os
import json
import time

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from scrapers.germany import scrape_germany
from scrapers.usa import scrape_usa
from scrapers.japan import scrape_japan
from scrapers.universal import scrape_country, COUNTRY_CONFIG

# Map of country names to scraper functions
SCRAPERS = {
    "germany": {
        "func": scrape_germany,
        "description": "DAAD (German Academic Exchange Service)",
        "expected": "6000+",
    },
    "usa": {
        "func": lambda: scrape_usa(),
        "description": "College Scorecard API (US Dept. of Education)",
        "expected": "5000+",
    },
    "uk": {
        "func": lambda: scrape_country("UK", max_courses=1500),
        "description": "DuckDuckGo search (25 universities × 30 fields)",
        "expected": "1500",
    },
    "canada": {
        "func": lambda: scrape_country("Canada", max_courses=1200),
        "description": "DuckDuckGo search (20 universities × 30 fields)",
        "expected": "1200",
    },
    "australia": {
        "func": lambda: scrape_country("Australia", max_courses=1100),
        "description": "DuckDuckGo search (18 universities × 30 fields)",
        "expected": "1100",
    },
    "netherlands": {
        "func": lambda: scrape_country("Netherlands", max_courses=850),
        "description": "DuckDuckGo search (14 universities × 30 fields)",
        "expected": "850",
    },
    "sweden": {
        "func": lambda: scrape_country("Sweden", max_courses=720),
        "description": "DuckDuckGo search (12 universities × 30 fields)",
        "expected": "720",
    },
    "france": {
        "func": lambda: scrape_country("France", max_courses=900),
        "description": "DuckDuckGo search (15 universities × 30 fields)",
        "expected": "900",
    },
    "switzerland": {
        "func": lambda: scrape_country("Switzerland", max_courses=600),
        "description": "DuckDuckGo search (10 universities × 30 fields)",
        "expected": "600",
    },
    "japan": {
        "func": lambda: scrape_japan(),
        "description": "Study in Japan (JASSO) + DuckDuckGo fallback",
        "expected": "850+",
    },
}


def _scrape_uk_fallback():
    """UK fallback: try dedicated scraper first, then universal."""
    try:
        from scrapers.uk import scrape_uk
        result = scrape_uk()
        if result and len(result) > 50:
            return result
    except Exception as e:
        print(f"⚠️  UK dedicated scraper failed: {e}")

    # Add UK to COUNTRY_CONFIG temporarily if not present
    if "UK" not in COUNTRY_CONFIG:
        COUNTRY_CONFIG["UK"] = {
            "search_terms": ["{field} master's {uni} UK"],
            "top_universities": [
                "University of Oxford", "University of Cambridge",
                "Imperial College London", "UCL",
                "University of Edinburgh", "King's College London",
                "University of Manchester", "University of Bristol",
                "University of Warwick", "University of Glasgow",
                "University of Birmingham", "University of Leeds",
                "University of Sheffield", "University of Southampton",
                "University of Nottingham", "University of Liverpool",
                "University of Exeter", "University of Bath",
                "Queen Mary University of London", "Lancaster University",
                "University of York", "Durham University",
                "University of St Andrews", "Loughborough University",
                "University of Surrey",
            ],
        }
        from scrapers.universal import COUNTRY_CITIES
        COUNTRY_CITIES["UK"] = {
            "University of Oxford": "Oxford", "University of Cambridge": "Cambridge",
            "Imperial College London": "London", "UCL": "London",
            "University of Edinburgh": "Edinburgh", "King's College London": "London",
            "University of Manchester": "Manchester", "University of Bristol": "Bristol",
            "University of Warwick": "Coventry", "University of Glasgow": "Glasgow",
            "University of Birmingham": "Birmingham", "University of Leeds": "Leeds",
            "University of Sheffield": "Sheffield", "University of Southampton": "Southampton",
            "University of Nottingham": "Nottingham", "University of Liverpool": "Liverpool",
            "University of Exeter": "Exeter", "University of Bath": "Bath",
            "Queen Mary University of London": "London", "Lancaster University": "Lancaster",
            "University of York": "York", "Durham University": "Durham",
            "University of St Andrews": "St Andrews", "Loughborough University": "Loughborough",
            "University of Surrey": "Guildford",
        }
    return scrape_country("UK", max_courses=1500)


def show_status():
    """Show current data file status."""
    data_dir = os.path.join(os.path.dirname(__file__), "data")
    print("\n📊 Data File Status:")
    print("=" * 60)
    for name in SCRAPERS:
        filename = f"{name}.json"
        filepath = os.path.join(data_dir, filename)
        if os.path.exists(filepath):
            with open(filepath) as f:
                data = json.load(f)
            size_kb = os.path.getsize(filepath) / 1024
            mod_time = time.strftime("%Y-%m-%d %H:%M", time.localtime(os.path.getmtime(filepath)))
            print(f"  ✅ {name:15s} — {len(data):5d} courses — {size_kb:7.1f} KB — Updated: {mod_time}")
        else:
            print(f"  ❌ {name:15s} — NOT FOUND (expected: {SCRAPERS[name]['expected']} courses)")
    print()


def show_list():
    """Show available scrapers."""
    print("\n📋 Available Country Scrapers:")
    print("=" * 60)
    for name, info in SCRAPERS.items():
        print(f"  {name:15s} — {info['description']}")
        print(f"  {'':15s}   Expected: ~{info['expected']} courses")
    print()


def main():
    args = [a.lower() for a in sys.argv[1:]]

    if "--help" in args or "-h" in args:
        print(__doc__)
        return

    if "--list" in args:
        show_list()
        return

    if "--status" in args:
        show_status()
        return

    # Determine which countries to scrape
    if not args:
        countries = list(SCRAPERS.keys())
        print(f"\n🚀 Scraping ALL {len(countries)} countries...")
        print("   This will take a while. You can also run specific countries:")
        print("   python run_all.py usa canada uk\n")
    else:
        countries = []
        for a in args:
            if a in SCRAPERS:
                countries.append(a)
            else:
                print(f"⚠️  Unknown country: {a}. Use --list to see available countries.")

    if not countries:
        print("No valid countries specified. Use --list to see available options.")
        return

    # Run scrapers
    total_courses = 0
    results = {}
    for country in countries:
        print(f"\n{'='*60}")
        print(f"  Starting: {country.upper()}")
        print(f"  Source: {SCRAPERS[country]['description']}")
        print(f"{'='*60}")

        start = time.time()
        try:
            data = SCRAPERS[country]["func"]()
            count = len(data) if data else 0
            elapsed = time.time() - start
            results[country] = {"count": count, "time": elapsed, "status": "✅"}
            total_courses += count
        except Exception as e:
            elapsed = time.time() - start
            results[country] = {"count": 0, "time": elapsed, "status": "❌", "error": str(e)}
            print(f"\n❌ {country} failed: {e}")

    # Summary
    print(f"\n\n{'='*60}")
    print(f"  SCRAPING COMPLETE — Summary")
    print(f"{'='*60}")
    for country, info in results.items():
        status = info["status"]
        count = info["count"]
        elapsed = info["time"]
        error = info.get("error", "")
        print(f"  {status} {country:15s} — {count:5d} courses — {elapsed:.0f}s {error}")
    print(f"\n  Total: {total_courses} courses across {len(countries)} countries")
    print()


if __name__ == "__main__":
    main()
