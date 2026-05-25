import os
import json
import time
import sys
from dotenv import load_dotenv
from google import genai
from google.genai import types

# Load env from parent directory
load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"))

API_KEY = os.environ.get("GEMINI_API_KEY")

COUNTRIES_CONFIG = {
    "UK": {
        "unis": ["University of Oxford", "University of Cambridge", "Imperial College London", "UCL", "University of Edinburgh", "King's College London", "University of Manchester", "University of Bristol", "University of Warwick", "University of Glasgow"],
        "tld": "ac.uk"
    },
    "Canada": {
        "unis": ["University of Toronto", "McGill University", "University of British Columbia", "University of Alberta", "University of Waterloo", "McMaster University", "University of Calgary", "Western University", "Queen's University", "University of Ottawa"],
        "tld": "ca"
    },
    "Australia": {
        "unis": ["University of Melbourne", "University of Sydney", "Australian National University", "University of Queensland", "University of New South Wales", "Monash University", "University of Western Australia", "University of Adelaide", "University of Technology Sydney", "RMIT University"],
        "tld": "edu.au"
    },
    "Netherlands": {
        "unis": ["TU Delft", "University of Amsterdam", "Eindhoven University of Technology", "Leiden University", "Utrecht University", "Wageningen University", "University of Groningen", "Erasmus University Rotterdam", "Vrije Universiteit Amsterdam", "Maastricht University"],
        "tld": "nl"
    },
    "Sweden": {
        "unis": ["KTH Royal Institute of Technology", "Chalmers University of Technology", "Lund University", "Uppsala University", "Stockholm University", "Linköping University", "University of Gothenburg", "Umeå University"],
        "tld": "se"
    },
    "France": {
        "unis": ["Sorbonne University", "École Polytechnique", "Université PSL", "University of Paris-Saclay", "Sciences Po", "INSA Lyon", "CentraleSupélec", "Grenoble INP"],
        "tld": "fr"
    },
    "Switzerland": {
        "unis": ["ETH Zurich", "EPFL", "University of Zurich", "University of Basel", "University of Bern", "University of Geneva", "University of Lausanne", "University of St. Gallen"],
        "tld": "ch"
    },
    "Japan": {
        "unis": ["University of Tokyo", "Kyoto University", "Osaka University", "Tokyo Institute of Technology", "Tohoku University", "Nagoya University", "Kyushu University", "Hokkaido University", "Keio University", "Waseda University"],
        "tld": "ac.jp"
    }
}

FIELDS = [
    "Computer Science", "Electrical Engineering", "Mechanical Engineering",
    "Data Science", "Business Administration", "Civil Engineering",
    "Aerospace Engineering", "Biomedical Engineering", "Information Technology",
    "Physics", "Mathematics", "Economics", "Medicine", "Law",
    "Software Engineering", "Cybersecurity", "Finance", "Chemistry"
]

def generate_for_country(client, country, config):
    print(f"\n🚀 Generating static data for {country} using Gemini...")
    all_courses = []
    
    # We do two requests: one for Master, one for Bachelor
    for degree in ["Master", "Bachelor"]:
        print(f"  Querying for {degree} programs...")
        prompt = f"""You are a university database compiler. Generate a comprehensive JSON database list of exactly 80 real, actual {degree} degree programs offered in {country}.
The programs must be across these universities: {', '.join(config['unis'])}.
And must cover these fields: {', '.join(FIELDS)}.

For each program, you MUST return a real, actual, direct URL to that specific program page or admissions page on the official university website. Do not invent links or return generic search page/homepage links.

Format your response EXACTLY as a JSON array of objects (no markdown fences, no text outside the array). Each object must have these exact keys:
{{
  "country": "{country}",
  "uni": "Full university name",
  "course": "e.g. {'MSc in Computer Science' if degree == 'Master' else 'BSc in Computer Science'}",
  "degree": "{degree}",
  "city": "City name",
  "link": "The real direct URL to the course page"
}}
"""
        
        try:
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json"
                )
            )
            text = response.text.strip()
            # Strip potential markdown code block format
            if text.startswith("```"):
                text = text.split("```")[1]
                if text.startswith("json"):
                    text = text[4:]
            
            data = json.loads(text.strip())
            if isinstance(data, list):
                print(f"    ✓ Successfully generated {len(data)} {degree} programs.")
                all_courses.extend(data)
            else:
                print(f"    ⚠️ Response was not a list for {degree}.")
        except Exception as e:
            print(f"    ❌ Error generating {degree} for {country}: {e}")
            
        time.sleep(2) # Prevent rate limits
        
    if not all_courses:
        return []
        
    # Deduplicate and save
    seen = set()
    deduped = []
    for c in all_courses:
        key = (c.get("uni"), c.get("course"), c.get("degree"))
        if key not in seen and c.get("uni") and c.get("course"):
            seen.add(key)
            deduped.append(c)
            
    output_path = os.path.join(
        os.path.dirname(os.path.dirname(__file__)), "data", f"{country.lower()}.json"
    )
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w") as f:
        json.dump(deduped, f, indent=2, ensure_ascii=False)
        
    print(f"✅ Saved {len(deduped)} unique courses to data/{country.lower()}.json")
    return deduped

def main():
    if not API_KEY:
        print("❌ GEMINI_API_KEY env variable not set.")
        sys.exit(1)
        
    client = genai.Client(api_key=API_KEY)
    
    target_countries = sys.argv[1:] if len(sys.argv) > 1 else list(COUNTRIES_CONFIG.keys())
    
    for country in target_countries:
        if country in COUNTRIES_CONFIG:
            generate_for_country(client, country, COUNTRIES_CONFIG[country])
        else:
            # Case insensitive match
            matched = False
            for k in COUNTRIES_CONFIG:
                if k.lower() == country.lower():
                    generate_for_country(client, k, COUNTRIES_CONFIG[k])
                    matched = True
                    break
            if not matched:
                print(f"❌ Unknown country: {country}")

if __name__ == "__main__":
    main()
