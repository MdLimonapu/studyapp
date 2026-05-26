import os
import json
import time
import sys
import traceback
from concurrent.futures import ThreadPoolExecutor, as_completed
from dotenv import load_dotenv
from google import genai
from google.genai import types
from google.genai.errors import APIError

# Load env from parent directory
load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"))

API_KEY = os.environ.get("GEMINI_API_KEY")
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
os.makedirs(DATA_DIR, exist_ok=True)

# Configuration for countries, including how many universities to fetch and target course counts
COUNTRIES_CONFIG = {
    "USA": {
        "num_unis": 50,
        "courses_per_uni": 20,
        "target_total": 1000
    },
    "UK": {
        "num_unis": 40,
        "courses_per_uni": 20,
        "target_total": 800
    },
    "Canada": {
        "num_unis": 30,
        "courses_per_uni": 20,
        "target_total": 600
    },
    "Australia": {
        "num_unis": 30,
        "courses_per_uni": 20,
        "target_total": 600
    },
    "Netherlands": {
        "num_unis": 15,
        "courses_per_uni": 30,
        "target_total": 450
    },
    "Sweden": {
        "num_unis": 15,
        "courses_per_uni": 20,
        "target_total": 300
    },
    "France": {
        "num_unis": 30,
        "courses_per_uni": 20,
        "target_total": 600
    },
    "Switzerland": {
        "num_unis": 12,
        "courses_per_uni": 20,
        "target_total": 240
    },
    "Japan": {
        "num_unis": 15,
        "courses_per_uni": 20,
        "target_total": 300
    }
}

def get_client():
    if not API_KEY:
        print("❌ GEMINI_API_KEY not found in .env file.")
        sys.exit(1)
    return genai.Client(api_key=API_KEY)

def call_gemini_with_retry(client, prompt, mime_type="application/json", use_search=False):
    """Call Gemini with exponential backoff on rate limits (429)."""
    backoff = 5
    max_retries = 8
    for attempt in range(max_retries):
        try:
            config_args = {"response_mime_type": mime_type}
            if use_search:
                config_args["tools"] = [types.Tool(google_search=types.GoogleSearch())]
            
            response = client.models.generate_content(
                model="gemini-flash-lite-latest",
                contents=prompt,
                config=types.GenerateContentConfig(**config_args)
            )
            return response.text.strip()
        except APIError as e:
            if e.code == 429 or "quota" in str(e).lower() or "limit" in str(e).lower():
                print(f"    ⚠️ Rate limit (429) hit on attempt {attempt+1}. Sleeping for {backoff} seconds...")
                time.sleep(backoff)
                backoff = min(backoff * 2, 60)
            else:
                print(f"    ❌ API Error: {e}")
                time.sleep(2)
        except Exception as e:
            print(f"    ⚠️ Request error: {e}. Retrying in 5 seconds...")
            time.sleep(5)
    raise RuntimeError("Failed to call Gemini after multiple retries")

def get_universities_list(client, country, count):
    """Ask Gemini for the list of top universities in the country."""
    print(f"\n📋 Fetching top {count} universities in {country}...")
    prompt = f"""You are a university registry database. List the top {count} officially recognized higher education universities in {country} that offer degree programs.
Return the result ONLY as a JSON list of strings (university names). Do not include any formatting, markdown, or other text outside the JSON list."""
    
    try:
        res = call_gemini_with_retry(client, prompt)
        if res.startswith("```"):
            res = res.split("```")[1]
            if res.startswith("json"):
                res = res[4:]
        unis = json.loads(res.strip())
        if isinstance(unis, list):
            # Clean and return
            return [u.strip() for u in unis if u.strip()]
    except Exception as e:
        print(f"    ❌ Failed to parse universities list: {e}")
    return []

def get_existing_unis(filepath):
    """Load existing data and extract university names to enable resume."""
    if not os.path.exists(filepath):
        return set(), []
    try:
        with open(filepath, "r") as f:
            data = json.load(f)
        if isinstance(data, list):
            unis = set(c.get("uni") for c in data if c.get("uni"))
            return unis, data
    except Exception:
        pass
    return set(), []

def crawl_university_courses(client, country, uni, limit):
    """Query Gemini for English-taught courses at a university."""
    print(f"  🔍 Crawling up to {limit} courses for: {uni}")
    prompt = f"""You are a course database crawler. Find up to {limit} major English-taught Bachelor's and Master's degree programs offered by '{uni}' in '{country}'.
For each program, you MUST return a real, actual, direct URL to that specific program page or admissions page on the official university website.
You MUST predict the actual direct URL to the specific course page or admissions page on the official university website (e.g. 'https://cs.stanford.edu/academics/masters'). Do not invent links or return generic search page/homepage/Google Search links.
Also, include the tuition fee for international students if available, under the key 'fee'. If not available, set it to null.

Format your response ONLY as a JSON array of objects (no markdown, no extra text). Each object must have these exact keys:
{{
  "country": "{country}",
  "uni": "{uni}",
  "course": "e.g. MSc in Computer Science or BSc in Electrical Engineering",
  "degree": "Master or Bachelor",
  "city": "City name",
  "link": "The real direct URL to the course page",
  "fee": "e.g. '$45,000 / year' or null"
}}
"""
    try:
        res = call_gemini_with_retry(client, prompt, use_search=False)
        if res.startswith("```"):
            res = res.split("```")[1]
            if res.startswith("json"):
                res = res[4:]
        courses = json.loads(res.strip())
        if isinstance(courses, list):
            # Filter out entries that don't have valid links
            valid_courses = []
            for c in courses:
                link = c.get("link", "")
                if link and ("http://" in link or "https://" in link) and "example.com" not in link:
                    valid_courses.append(c)
            print(f"    ✓ Retrieved {len(valid_courses)} verified courses for {uni}.")
            return valid_courses
    except Exception as e:
        print(f"    ❌ Error crawling {uni}: {e}")
    return []

def crawl_country(client, country):
    print(f"\n{'='*70}")
    print(f"  STARTING GROUNDED CRAWL FOR {country.upper()}")
    print(f"{'='*70}")
    
    config = COUNTRIES_CONFIG[country]
    filepath = os.path.join(DATA_DIR, f"{country.lower()}.json")
    
    # Get already scraped universities to enable resume
    scraped_unis, existing_courses = get_existing_unis(filepath)
    print(f"ℹ️ Loaded {len(existing_courses)} existing courses. {len(scraped_unis)} universities already processed.")
    
    # Fetch list of universities
    all_unis = get_universities_list(client, country, config["num_unis"])
    if not all_unis:
        print(f"❌ Could not retrieve universities list for {country}. Skipping.")
        return
        
    unis_to_process = [u for u in all_unis if u not in scraped_unis]
    print(f"ℹ️ Found {len(all_unis)} universities total. {len(unis_to_process)} remaining to process.")
    
    new_courses_count = 0
    
    # Process sequentially with a 4.5s delay to stay under the 15 RPM free tier limit
    for uni in unis_to_process:
        try:
            courses = crawl_university_courses(client, country, uni, config["courses_per_uni"])
            if courses:
                # Append and save incrementally
                existing_courses.extend(courses)
                new_courses_count += len(courses)
                
                # Deduplicate by (uni, course, degree)
                seen = set()
                deduped = []
                for c in existing_courses:
                    k = (c.get("uni"), c.get("course"), c.get("degree"))
                    if k not in seen:
                        seen.add(k)
                        deduped.append(c)
                
                existing_courses = deduped
                
                with open(filepath, "w") as f:
                    json.dump(existing_courses, f, indent=2, ensure_ascii=False)
                print(f"    💾 Saved progress for {uni}. Total courses in database: {len(existing_courses)}")
            
            # Rate limit sleep
            time.sleep(4.5)
        except Exception as e:
            print(f"❌ Error processing {uni}: {e}")
            time.sleep(5)
            
    print(f"✅ Finished crawling {country}. Added {new_courses_count} new courses.")

def main():
    client = get_client()
    
    target_countries = sys.argv[1:] if len(sys.argv) > 1 else list(COUNTRIES_CONFIG.keys())
    
    for country in target_countries:
        try:
            if country in COUNTRIES_CONFIG:
                crawl_country(client, country)
            else:
                print(f"❌ Country {country} not configured in COUNTRIES_CONFIG.")
        except Exception as e:
            print(f"❌ Failed crawling {country}: {e}")
            traceback.print_exc()

if __name__ == "__main__":
    main()
