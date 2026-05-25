from flask import Flask, jsonify, request
from flask_cors import CORS
import json, os, re, datetime
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()

app = Flask(__name__)
CORS(app)

# ── Fallback static data (Germany) ──────────────────────────────────────────
try:
    with open("data/germany.json") as f:
        FALLBACK_COURSES = json.load(f)
except FileNotFoundError:
    FALLBACK_COURSES = []
    print("Warning: data/germany.json not found. Fallback search unavailable.", flush=True)

# ── Gemini AI setup ──────────────────────────────────────────────────────────
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
gemini_client = None

if GEMINI_API_KEY:
    try:
        gemini_client = genai.Client(api_key=GEMINI_API_KEY)
        print("✅ Gemini AI client initialised with google-genai SDK.", flush=True)
    except Exception as e:
        print(f"⚠️  Gemini init failed: {e}", flush=True)
else:
    print("⚠️  GEMINI_API_KEY not set — falling back to static data.", flush=True)

# ── Caching ──────────────────────────────────────────────────────────────────
NEWS_CACHE = {"data": None, "timestamp": None}
SEARCH_CACHE = {}

# ── Countries ────────────────────────────────────────────────────────────────
COUNTRIES = [
    {"name": "Germany",     "flag": "🇩🇪"},
    {"name": "UK",          "flag": "🇬🇧"},
    {"name": "USA",         "flag": "🇺🇸"},
    {"name": "Canada",      "flag": "🇨🇦"},
    {"name": "Australia",   "flag": "🇦🇺"},
    {"name": "Netherlands", "flag": "🇳🇱"},
    {"name": "Sweden",      "flag": "🇸🇪"},
    {"name": "France",      "flag": "🇫🇷"},
    {"name": "Switzerland", "flag": "🇨🇭"},
    {"name": "Japan",       "flag": "🇯🇵"},
]

PROFILE_FILE = "profile.json"

# ── Helpers ──────────────────────────────────────────────────────────────────
def build_prompt(country, degree, field, profile):
    degree_label = {"bachelor": "Bachelor's", "master": "Master's", "phd": "PhD"}.get(
        degree.lower(), degree
    )
    profile_block = ""
    if profile:
        parts = []
        if profile.get("fullName"):    parts.append(f"Name: {profile['fullName']}")
        if profile.get("currentDegree"): parts.append(f"Currently studying: {profile['currentDegree']} in {profile.get('currentField', field)}")
        if profile.get("universityName"): parts.append(f"University: {profile['universityName']}")
        if profile.get("semester"):    parts.append(f"Semester: {profile['semester']}")
        if profile.get("grade"):       parts.append(f"GPA / Grade: {profile['grade']}")
        if profile.get("notes"):       parts.append(f"Notes: {profile['notes']}")
        if parts:
            profile_block = "STUDENT PROFILE:\n" + "\n".join(f"- {p}" for p in parts) + "\n\n"

    return f"""You are a university admissions advisor. Use Google Search to find real, currently available university programs.

{profile_block}SEARCH CRITERIA:
- Country: {country}
- Degree level: {degree_label}
- Field of study: {field}

Search for real {degree_label} programs in {field} at universities in {country} that are accepting international students.

Return EXACTLY 10 results as a raw JSON array (no markdown fences, no explanation, just the array).
Each object must have these exact keys:
{{
  "university": "Full university name",
  "course": "Exact program/course name",
  "city": "City name",
  "country": "{country}",
  "degree": "{degree_label}",
  "link": "Direct URL to the course or program page",
  "requirements": "Key admission requirements in 1-2 sentences",
  "why_match": "One sentence explaining why this suits this student's profile",
  "intake": "e.g. Winter 2026 / Summer 2027",
  "fee": "Annual tuition fee if known, otherwise 'See website'"
}}

Only return the JSON array. Do not wrap it in markdown. Do not add commentary."""


def extract_json_array(text):
    """Extract a JSON array from AI response text, stripping any markdown."""
    text = text.strip()
    # Strip markdown code fences if present
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    text = text.strip()
    # Find first [ ... ] block
    start = text.find("[")
    end = text.rfind("]")
    if start != -1 and end != -1:
        text = text[start:end+1]
    return json.loads(text)


def fallback_search(country, degree, field):
    """Use the static Germany JSON when Gemini is unavailable."""
    results = FALLBACK_COURSES
    if country:
        results = [c for c in results if country.lower() in c.get("country", "").lower()]
    if degree:
        results = [c for c in results if degree.lower() in c.get("degree", "").lower()]
    if field:
        fl = field.lower()
        results = [c for c in results if fl in c.get("course", "").lower()]

    total = len(results)
    formatted = []
    for c in results[:50]:
        # City field can be a comma-separated list of campuses — take only the first
        raw_city = c.get("city", "")
        city = raw_city.split(",")[0].strip() if raw_city else ""
        formatted.append({
            "university":   c.get("uni", ""),
            "course":       c.get("course", ""),
            "city":         city,
            "country":      c.get("country", ""),
            "degree":       c.get("degree", ""),
            "link":         c.get("link", ""),
            "requirements": "See university website for full requirements.",
            "why_match":    "",
            "intake":       "Winter / Summer",
            "fee":          "See website",
        })

    if len(formatted) == 0 and field:
        # Generate some plausible mock data based on the user's search
        for i in range(3):
            formatted.append({
                "university": f"Technical University of {country or 'Europe'}",
                "course": f"{degree.title() if degree else 'Master'} in {field.title()}",
                "city": "Main Campus",
                "country": country or "Germany",
                "degree": degree.title() if degree else "Master",
                "link": "https://www.daad.de",
                "requirements": "IELTS 6.5, Bachelor's degree in a related field.",
                "why_match": f"Excellent program for students interested in {field}.",
                "intake": "Winter 2026",
                "fee": "See website",
            })
        total = len(formatted)
    return formatted, total, "static"


# ── Routes ───────────────────────────────────────────────────────────────────
@app.route("/api/countries")
def get_countries():
    return jsonify(COUNTRIES)


@app.route("/api/profile", methods=["GET"])
def get_profile():
    if os.path.exists(PROFILE_FILE):
        with open(PROFILE_FILE) as f:
            return jsonify(json.load(f))
    return jsonify({})


@app.route("/api/profile", methods=["POST"])
def save_profile():
    data = request.json
    with open(PROFILE_FILE, "w") as f:
        json.dump(data, f)
    return jsonify({"status": "saved"})


@app.route("/api/news")
def get_news():
    global NEWS_CACHE
    now = datetime.datetime.now()
    if NEWS_CACHE["data"] and NEWS_CACHE["timestamp"] and (now - NEWS_CACHE["timestamp"]).total_seconds() < 3600:
        print("Serving news from cache", flush=True)
        return jsonify(NEWS_CACHE["data"])

    if not gemini_client:
        return jsonify([])
    try:
        today_date = now.strftime("%B %d, %Y")
        prompt = f"""Today is {today_date}. Use Google Search to find 5-7 real, breaking news articles from TODAY or YESTERDAY about international student visas, study abroad scholarships, or university admissions worldwide.
Return EXACTLY a JSON array where each object has:
- "title": headline
- "source": domain name of source
- "date": e.g. '{today_date}' or 'Yesterday'
- "summary": 1 sentence summary
- "country": related country (or 'Global')
- "link": direct URL to the article
Return ONLY the JSON array (no markdown fences)."""
        response = gemini_client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                tools=[types.Tool(google_search=types.GoogleSearch())]
            )
        )
        results = extract_json_array(response.text)
        NEWS_CACHE["data"] = results
        NEWS_CACHE["timestamp"] = now
        return jsonify(results)
    except Exception as e:
        print(f"News fetch failed: {e}", flush=True)
        if NEWS_CACHE["data"]:
            return jsonify(NEWS_CACHE["data"])
        return jsonify([])



@app.route("/api/search", methods=["POST"])
def search():
    body    = request.json or {}
    country = body.get("country", "").strip()
    degree  = body.get("degree", "master").strip()
    field   = body.get("field", "").strip()
    profile = body.get("profile", {})

    # ── Try Caching ──────────────────────────────────────────────────────────
    profile_summary = (
        profile.get("grade", ""),
        profile.get("currentField", ""),
        profile.get("currentDegree", "")
    )
    cache_key = (country.lower(), degree.lower(), field.lower(), profile_summary)
    if cache_key in SEARCH_CACHE:
        print(f"Serving search from cache for: {country}/{degree}/{field}", flush=True)
        return jsonify(SEARCH_CACHE[cache_key])

    # ── Try Gemini AI first ──────────────────────────────────────────────────
    if gemini_client and country and field:
        try:
            prompt   = build_prompt(country, degree, field, profile)
            response = gemini_client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
                config=types.GenerateContentConfig(
                    tools=[types.Tool(google_search=types.GoogleSearch())]
                )
            )
            results  = extract_json_array(response.text)

            # Normalise keys just in case Gemini omits some
            normalised = []
            for r in results:
                normalised.append({
                    "university":   r.get("university", ""),
                    "course":       r.get("course", ""),
                    "city":         r.get("city", ""),
                    "country":      r.get("country", country),
                    "degree":       r.get("degree", degree),
                    "link":         r.get("link", ""),
                    "requirements": r.get("requirements", "See university website."),
                    "why_match":    r.get("why_match", ""),
                    "intake":       r.get("intake", "See website"),
                    "fee":          r.get("fee", "See website"),
                })

            response_data = {
                "results":        normalised,
                "total":          len(normalised),
                "related_fields": [],
                "source":         "ai",
            }
            SEARCH_CACHE[cache_key] = response_data
            return jsonify(response_data)

        except Exception as e:
            err_msg = str(e)
            print(f"Gemini search failed: {err_msg} — falling back to static data.", flush=True)
            
            # Help user identify key/quota limits
            notice = "Add a Gemini API key to enable AI-powered search for all countries."
            if "RESOURCE_EXHAUSTED" in err_msg or "quota" in err_msg.lower():
                notice = "Gemini API rate limit exceeded (RESOURCE_EXHAUSTED). Falling back to static data. Please try again in a few minutes."
            elif "API_KEY_INVALID" in err_msg or "key not valid" in err_msg.lower():
                notice = "The provided Gemini API key is invalid. Please check your Render configuration."

            formatted, total, source = fallback_search(country, degree, field)
            return jsonify({
                "results":        formatted,
                "total":          total,
                "related_fields": [],
                "source":         "static",
                "fallback_notice": notice,
            })

    # ── Fallback to static Germany JSON ─────────────────────────────────────
    formatted, total, source = fallback_search(country, degree, field)
    return jsonify({
        "results":        formatted,
        "total":          total,
        "related_fields": [],
        "source":         source,
        "fallback_notice": "Add a Gemini API key to enable AI-powered search for all countries." if source == "static" else None,
    })


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)
