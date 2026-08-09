import json
from urllib.parse import urlparse

# Map university names to their main homepage/admissions domain
UNI_DOMAINS = {
    "University of Toronto": "https://www.utoronto.ca",
    "University of British Columbia": "https://www.ubc.ca",
    "McGill University": "https://www.mcgill.ca",
    "University of Alberta": "https://www.ualberta.ca",
    "University of Waterloo": "https://uwaterloo.ca",
    "McMaster University": "https://www.mcmaster.ca",
    "University of Calgary": "https://www.ucalgary.ca",
    "Western University": "https://www.uwo.ca",
    "Queen's University": "https://www.queensu.ca",
    "University of Ottawa": "https://www.uottawa.ca",
    "York University": "https://www.yorku.ca",
    "Université de Montréal": "https://www.umontreal.ca",
    "Dalhousie University": "https://www.dal.ca",
    "Ryerson University": "https://www.torontomu.ca",
    "University of Guelph": "https://www.uoguelph.ca",
    "Brock University": "https://brocku.ca",
    "Carleton University": "https://carleton.ca",
    "University of New Brunswick": "https://www.unb.ca",
    "Memorial University of Newfoundland": "https://www.mun.ca",
    "University of Windsor": "https://www.uwindsor.ca",
    "University of Victoria": "https://www.uvic.ca",
    "Laval University": "https://www.ulaval.ca",
    "University of Regina": "https://www.uregina.ca",
    "Lakehead University": "https://www.lakeheadu.ca",
    "University of Manitoba": "https://umanitoba.ca"
}

def main():
    print("Loading data...")
    with open('/Users/mdlimonapu/studyapp/backend/data/canada.json', 'r') as f:
        data = json.load(f)
        
    with open('/Users/mdlimonapu/studyapp/backend/data/broken_canada_links.json', 'r') as f:
        broken_list = json.load(f)
        
    broken_urls = {item[0] for item in broken_list}
    print(f"Loaded {len(broken_urls)} broken URLs to fix.")
    
    fixed_count = 0
    for entry in data:
        link = entry.get('link')
        if link in broken_urls:
            uni = entry.get('uni')
            # Look up verified domain
            fallback = UNI_DOMAINS.get(uni)
            if not fallback:
                # If not in our dictionary, extract the main hostname domain dynamically
                parsed = urlparse(link)
                fallback = f"{parsed.scheme}://{parsed.netloc}"
                
            entry['link'] = fallback
            if 'source_url' in entry:
                entry['source_url'] = fallback
            if 'admissions' in entry and isinstance(entry['admissions'], dict):
                entry['admissions']['link'] = fallback
            fixed_count += 1
            
    print(f"Successfully patched {fixed_count} broken entries in the dataset.")
    
    with open('/Users/mdlimonapu/studyapp/backend/data/canada.json', 'w') as f:
        json.dump(data, f, indent=2)
        
if __name__ == '__main__':
    main()
