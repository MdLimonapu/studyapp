import os
import json
import time
import sys
from dotenv import load_dotenv
from google import genai
from google.genai import types
from google.genai.errors import APIError

load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"))
API_KEY = os.environ.get("GEMINI_API_KEY")

COUNTRIES_CONFIG = {
    "UK": {
        "website": "UCAS (ucas.com)",
        "unis": [
            "University of Oxford", "University of Cambridge", "Imperial College London", "UCL",
            "University of Edinburgh", "King's College London", "University of Manchester", "University of Bristol",
            "University of Warwick", "University of Glasgow", "University of Birmingham", "University of Leeds",
            "University of Sheffield", "University of Southampton", "University of Nottingham", "University of Liverpool",
            "Newcastle University", "Cardiff University", "Queen's University Belfast", "University of St Andrews",
            "University of Exeter", "University of Bath", "University of York", "Durham University"
        ]
    },
    "Canada": {
        "website": "Universities Canada (universitystudy.ca)",
        "unis": [
            "University of Toronto", "McGill University", "University of British Columbia", "University of Alberta",
            "University of Waterloo", "McMaster University", "University of Calgary", "Western University",
            "Queen's University", "University of Ottawa", "Simon Fraser University", "Dalhousie University",
            "York University", "Concordia University", "Carleton University", "University of Victoria"
        ]
    },
    "Australia": {
        "website": "Course Seeker Australia (courseseeker.edu.au)",
        "unis": [
            "University of Melbourne", "University of Sydney", "Australian National University", "University of Queensland",
            "University of New South Wales", "Monash University", "University of Western Australia", "University of Adelaide",
            "University of Technology Sydney", "RMIT University", "Macquarie University", "Griffith University",
            "Curtin University", "Deakin University", "Queensland University of Technology", "University of Wollongong"
        ]
    },
    "Netherlands": {
        "website": "Study in NL (studyinnl.org)",
        "unis": [
            "TU Delft", "University of Amsterdam", "Eindhoven University of Technology", "Leiden University",
            "Utrecht University", "Wageningen University", "University of Groningen", "Erasmus University Rotterdam",
            "Vrije Universiteit Amsterdam", "Maastricht University", "Radboud University", "University of Twente",
            "Tilburg University"
        ]
    },
    "Sweden": {
        "website": "Study in Sweden (studyinsweden.se)",
        "unis": [
            "KTH Royal Institute of Technology", "Chalmers University of Technology", "Lund University", "Uppsala University",
            "Stockholm University", "Linköping University", "University of Gothenburg", "Umeå University",
            "Luleå University of Technology", "Malmö University"
        ]
    },
    "France": {
        "website": "Campus France (campusfrance.org)",
        "unis": [
            "Sorbonne University", "École Polytechnique", "Université PSL", "University of Paris-Saclay",
            "Sciences Po", "INSA Lyon", "CentraleSupélec", "Grenoble INP", "Université de Strasbourg",
            "ESSEC Business School", "HEC Paris", "École Normale Supérieure"
        ]
    },
    "Switzerland": {
        "website": "Swiss Universities (swissuniversities.ch)",
        "unis": [
            "ETH Zurich", "EPFL", "University of Zurich", "University of Basel",
            "University of Bern", "University of Geneva", "University of Lausanne", "University of St. Gallen"
        ]
    },
    "Japan": {
        "website": "Study in Japan (studyinjapan.go.jp)",
        "unis": [
            "University of Tokyo", "Kyoto University", "Osaka University", "Tokyo Institute of Technology",
            "Tohoku University", "Nagoya University", "Kyushu University", "Hokkaido University",
            "Keio University", "Waseda University", "Tsukuba University", "Kobe University", "Sophia University"
        ]
    },
    "USA": {
        "website": "EducationUSA (educationusa.state.gov)",
        "unis": [
            "Harvard University", "Massachusetts Institute of Technology", "Stanford University", "California Institute of Technology",
            "Columbia University", "New York University", "University of California, Berkeley", "University of California, Los Angeles",
            "University of Southern California", "University of Chicago", "Yale University", "Princeton University",
            "University of Pennsylvania", "Cornell University", "Carnegie Mellon University", "Georgia Institute of Technology",
            "Northwestern University", "Duke University", "Johns Hopkins University", "Rice University",
            "University of Texas at Austin", "University of Washington", "University of Wisconsin-Madison",
            "University of Illinois at Urbana-Champaign", "Purdue University", "Boston University", "Northeastern University"
        ]
    }
}

FIELDS = [
    "Computer Science", "Electrical Engineering", "Mechanical Engineering",
    "Data Science", "Business Administration", "Civil Engineering",
    "Aerospace Engineering", "Biomedical Engineering", "Information Technology",
    "Artificial Intelligence", "Robotics", "Environmental Engineering",
    "Chemical Engineering", "Physics", "Mathematics", "Economics",
    "Psychology", "Architecture", "Medicine", "Law",
    "Software Engineering", "Cybersecurity", "Finance", "Chemistry", "Marketing"
]

def call_gemini_with_retry(client, prompt):
    """Calls Gemini with a retry loop on rate limits."""
    backoff = 20
    while True:
        try:
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json"
                )
            )
            return response.text.strip()
        except APIError as e:
            if e.code == 429 or "quota" in str(e).lower() or "limit" in str(e).lower() or "resource_exhausted" in str(e).lower():
                print(f"    ⚠️ Rate limit (429) hit. Sleeping for {backoff} seconds...")
                time.sleep(backoff)
                backoff = min(backoff * 2, 70)
            else:
                raise e
        except Exception as e:
            if "exhausted" in str(e).lower() or "429" in str(e).lower():
                print(f"    ⚠️ Rate limit (429) hit. Sleeping for {backoff} seconds...")
                time.sleep(backoff)
                backoff = min(backoff * 2, 70)
            else:
                print(f"    ⚠️ Call error: {e}. Retrying in 10s...")
                time.sleep(10)

def generate_for_country(client, country, config):
    print(f"\n🚀 Generating high-quality database for {country} using Gemini...")
    prompt = f"""You are an official university database registry. Retrieve and compile a database of real, English-taught undergraduate and postgraduate programs for {country}.
The programs MUST be sourced from the listings of the official portal: {config['website']}.
The programs MUST be spread across these universities: {', '.join(config['unis'])}.
And must cover a good mix of these fields: {', '.join(FIELDS)}.

For this country, generate exactly 60 Master's programs and exactly 60 Bachelor's programs (120 programs in total).
For each program:
1. Provide the full name of the university.
2. Provide the exact course name (e.g. 'MSc in Computer Science' or 'BSc in Electrical Engineering' or similar standard format).
3. Provide the actual city where the university is located.
4. You MUST return a real, actual, direct URL to that specific program page or admissions page on the official university website. Do not invent links or return generic search page/homepage links.

Format your response EXACTLY as a JSON array of objects (no markdown fences, no text outside the array). Each object must have these exact keys:
{{
  "country": "{country}",
  "uni": "Full university name",
  "course": "Exact course name",
  "degree": "Master or Bachelor",
  "city": "City name",
  "link": "The real direct URL to the course page"
}}
"""
    try:
        text = call_gemini_with_retry(client, prompt)
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        
        data = json.loads(text.strip())
        if isinstance(data, list):
            # Deduplicate
            seen = set()
            deduped = []
            for c in data:
                key = (c.get("uni", "").strip().lower(), c.get("course", "").strip().lower(), c.get("degree", "").strip().lower())
                if key not in seen and c.get("uni") and c.get("course") and c.get("link"):
                    seen.add(key)
                    deduped.append(c)
            
            output_path = os.path.join(
                os.path.dirname(os.path.dirname(__file__)), "data", f"{country.lower()}.json"
            )
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            with open(output_path, "w") as f:
                json.dump(deduped, f, indent=2, ensure_ascii=False)
            print(f"    ✓ Successfully generated and saved {len(deduped)} programs for {country}.")
        else:
            print(f"    ⚠️ Response was not a list.")
    except Exception as e:
        print(f"    ❌ Error generating for {country}: {e}")
        
    time.sleep(5) # Prevent rate limits

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
