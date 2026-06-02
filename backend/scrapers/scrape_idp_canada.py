#!/usr/bin/env python3
import requests
import json
import time
from bs4 import BeautifulSoup

UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

def main():
    print("🇨🇦 Scraping IDP Canada Universities...")
    unis = []
    page = 1
    
    while True:
        url = f"https://www.idp.com/find-a-university/canada/?page={page}"
        print(f"Fetching page {page}...")
        try:
            res = requests.get(url, headers={"User-Agent": UA}, timeout=20)
            if res.status_code != 200:
                print(f"Finished or error: Status code {res.status_code}")
                break
                
            soup = BeautifulSoup(res.text, 'html.parser')
            script_tags = soup.find_all('script', type='application/ld+json')
            
            page_unis_count = 0
            for tag in script_tags:
                try:
                    data = json.loads(tag.string)
                    if data.get("@type") == "SearchResultsPage":
                        items = data.get("mainEntity", {}).get("itemListElement", [])
                        for item in items:
                            if item.get("@type") == "CollegeOrUniversity":
                                uni = {
                                    "name": item.get("name"),
                                    "url": item.get("url"),
                                    "description": item.get("description"),
                                }
                                if uni["name"] and uni not in unis:
                                    unis.append(uni)
                                    page_unis_count += 1
                except Exception as e:
                    continue
            
            print(f"  Found {page_unis_count} universities on page {page}.")
            if page_unis_count == 0:
                # No more universities found on this page
                break
                
            page += 1
            time.sleep(0.5) # Be polite
        except Exception as e:
            print("Error occurred:", e)
            break
            
    print(f"Total unique universities found: {len(unis)}")
    with open("backend/scrapers/idp_canada_unis.json", "w", encoding="utf-8") as f:
        json.dump(unis, f, indent=2, ensure_ascii=False)
    print("Saved to backend/scrapers/idp_canada_unis.json")

if __name__ == "__main__":
    main()
