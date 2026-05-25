import os
import json
import time
import sys
import traceback
from dotenv import load_dotenv
from google import genai
from google.genai import types
from google.genai.errors import APIError

# Load env from parent directory
load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"))

API_KEY = os.environ.get("GEMINI_API_KEY")

COUNTRIES = ["UK", "Canada", "Australia", "Netherlands", "Sweden", "France", "Switzerland", "Japan"]

FIELDS = [
    "Computer Science", "Electrical Engineering", "Mechanical Engineering",
    "Data Science", "Business Administration", "Civil Engineering",
    "Aerospace Engineering", "Biomedical Engineering", "Information Technology",
    "Physics", "Mathematics", "Economics", "Medicine", "Law",
    "Software Engineering", "Cybersecurity", "Finance", "Chemistry", "Marketing"
]

def get_client():
    if not API_KEY:
        print("❌ GEMINI_API_KEY not found in .env file.")
        sys.exit(1)
    return genai.Client(api_key=API_KEY)

def call_gemini_with_retry(client, prompt, mime_type="application/json"):
    """Call Gemini with exponential backoff on rate limits (429)."""
    backoff = 10
    while True:
        try:
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type=mime_type
                )
            )
            return response.text.strip()
        except APIError as e:
            if e.code == 429 or "quota" in str(e).lower() or "limit" in str(e).lower():
                print(f"    ⚠️ Rate limit (429) hit. Sleeping for {backoff} seconds...")
                time.sleep(backoff)
                backoff = min(backoff * 2, 60) # Double sleep up to 60s
            else:
                raise e
        except Exception as e:
            print(f"    ⚠️ Request error: {e}. Retrying in 10s...")
            time.sleep(10)

def get_universities_list(client, country):
    """Ask Gemini for a complete list of all universities in the country."""
    print(f"\n📋 Fetching complete list of universities in {country}...")
    prompt = f"""You are a university registry database. List all officially recognized higher education universities in {country} offering degrees in English.
Include both public and private universities.
Return the result ONLY as a JSON list of strings (university names). Do not include any formatting, markdown, or other text outside the JSON list."""
    
    try:
        res = call_gemini_with_retry(client, prompt)
        # Strip potential code block formatting
        if res.startswith("```"):
            res = res.split("```")[1]
            if res.startswith("json"):
                res = res[4:]
        unis = json.loads(res.strip())
        if isinstance(unis, list):
            print(f"    ✓ Found {len(unis)} universities for {country}.")
            return unis
    except Exception as e:
        print(f"    ❌ Failed to parse universities list: {e}")
    return []

def get_existing_unis(filepath):
    """Load existing data and extract university names to enable resume."""
    if not os.path.exists(filepath):
        return [], []
    try:
        with open(filepath, "r") as f:
            data = json.load(f)
        if isinstance(data, list):
            unis = list(set(c.get("uni") for c in data if c.get("uni")))
            return unis, data
    except Exception:
        pass
    return [], []

def crawl_university_courses(client, country, uni, city_guess=""):
    """Query Gemini for all English-taught courses at a specific university."""
    print(f"  🔍 Crawling courses for: {uni}")
    prompt = f"""You are a course database crawler. List major English-taught Bachelor's and Master's degree programs offered by '{uni}' in '{country}'.
Include major fields like: Computer Science, Engineering, Business, Finance, Physics, Medicine, Law, Economics, etc.
For each program, you MUST return a real, actual, direct URL to that specific program page or admissions page on the official university website. Do not invent links or return generic search page/homepage links.

Format your response ONLY as a JSON array of objects (no markdown, no extra text). Each object must have these exact keys:
{{
  "country": "{country}",
  "uni": "{uni}",
  "course": "e.g. MSc in Computer Science or BSc in Electrical Engineering",
  "degree": "Master or Bachelor",
  "city": "City name",
  "link": "The real direct URL to the course page"
}}
"""
    try:
        res = call_gemini_with_retry(client, prompt)
        if res.startswith("```"):
            res = res.split("```")[1]
            if res.startswith("json"):
                res = res[4:]
        courses = json.loads(res.strip())
        if isinstance(courses, list):
            print(f"    ✓ Retrieved {len(courses)} courses.")
            return courses
    except Exception as e:
        print(f"    ❌ Error crawling {uni}: {e}")
    return []

def crawl_country(client, country):
    print(f"\n{'='*70}")
    print(f"  STARTING CRAWL FOR {country.upper()}")
    print(f"{'='*70}")
    
    filepath = os.path.join(
        os.path.dirname(os.path.dirname(__file__)), "data", f"{country.lower()}.json"
    )
    
    # Get list of all universities
    all_unis = get_universities_list(client, country)
    if not all_unis:
        print(f"❌ Could not retrieve universities list for {country}. Skipping.")
        return
        
    # Get already scraped universities
    scraped_unis, existing_courses = get_existing_unis(filepath)
    print(f"ℹ️ Loaded {len(existing_courses)} existing courses. {len(scraped_unis)} universities already processed.")
    
    new_courses_count = 0
    
    # Crawl each university
    for uni in all_unis:
        if uni in scraped_unis:
            # Skip already crawled universities
            continue
            
        courses = crawl_university_courses(client, country, uni)
        if courses:
            existing_courses.extend(courses)
            new_courses_count += len(courses)
            
            # Save progress incrementally after every university!
            os.makedirs(os.path.dirname(filepath), exist_ok=True)
            with open(filepath, "w") as f:
                json.dump(existing_courses, f, indent=2, ensure_ascii=False)
            print(f"    💾 Saved progress. Total courses in database: {len(existing_courses)}")
            
        time.sleep(2) # Prevent hitting short-term limits
        
    print(f"✅ Finished crawling {country}. Added {new_courses_count} new courses.")

def main():
    client = get_client()
    
    target_countries = sys.argv[1:] if len(sys.argv) > 1 else COUNTRIES
    
    for country in target_countries:
        try:
            crawl_country(client, country)
        except Exception as e:
            print(f"❌ Failed crawling {country}: {e}")
            traceback.print_exc()

if __name__ == "__main__":
    main()
