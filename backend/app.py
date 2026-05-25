from flask import Flask, jsonify, request
from flask_cors import CORS
import json, os, re, datetime, requests
from bs4 import BeautifulSoup
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
API_KEYS = []

# Try parsing comma-separated list first
keys_str = os.environ.get("GEMINI_API_KEYS", "")
if keys_str:
    API_KEYS = [k.strip() for k in keys_str.split(",") if k.strip()]

# If no list is set, look for GEMINI_API_KEY and any numbered variants (GEMINI_API_KEY_1, GEMINI_API_KEY_2, etc.)
if not API_KEYS:
    main_key = os.environ.get("GEMINI_API_KEY", "").strip()
    if main_key:
        API_KEYS.append(main_key)

for env_key in sorted(os.environ.keys()):
    if env_key.startswith("GEMINI_API_KEY_"):
        val = os.environ.get(env_key, "").strip()
        if val and val not in API_KEYS:
            API_KEYS.append(val)

if API_KEYS:
    print(f"✅ Gemini AI key pool initialised with {len(API_KEYS)} key(s).", flush=True)
else:
    print("⚠️  No GEMINI_API_KEY or GEMINI_API_KEYS set — falling back to static data.", flush=True)


def generate_content_with_rotation(contents, config=None, model="gemini-2.5-flash"):
    global API_KEYS
    if not API_KEYS:
        raise Exception("No Gemini API keys configured.")

    last_error = None
    for i in range(len(API_KEYS)):
        key = API_KEYS[i]
        try:
            client = genai.Client(api_key=key)
            response = client.models.generate_content(
                model=model,
                contents=contents,
                config=config
            )
            # Promote successful key to the front of the list
            if i > 0:
                API_KEYS.insert(0, API_KEYS.pop(i))
            return response
        except Exception as e:
            err_msg = str(e)
            print(f"⚠️ Gemini API Key {i+1}/{len(API_KEYS)} failed: {err_msg}", flush=True)
            last_error = e
            # Only rotate if the error is due to rate limits or invalid key
            if "RESOURCE_EXHAUSTED" in err_msg or "quota" in err_msg.lower() or "API_KEY_INVALID" in err_msg or "key not valid" in err_msg.lower():
                continue
            else:
                raise e

    raise last_error

# ── Caching ──────────────────────────────────────────────────────────────────
NEWS_CACHE = {"data": None, "timestamp": None}
SEARCH_CACHE = {}

# ── DuckDuckGo search scraper ────────────────────────────────────────────────
def search_duckduckgo(query, max_results=8):
    url = "https://html.duckduckgo.com/html/"
    params = {"q": query}
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    try:
        response = requests.post(url, data=params, headers=headers, timeout=10)
        if response.status_code != 200:
            print(f"⚠️ DuckDuckGo returned status code {response.status_code}", flush=True)
            return []
        soup = BeautifulSoup(response.text, "html.parser")
        results = soup.select(".result")
        
        search_data = []
        for item in results:
            a = item.select_one(".result__a")
            snippet = item.select_one(".result__snippet")
            if a and snippet:
                link = a.get("href", "")
                if "/y.js" in link or "duckduckgo.com/y.js" in link:
                    continue
                title = a.get_text(strip=True)
                desc = snippet.get_text(strip=True)
                search_data.append({
                    "title": title,
                    "link": link,
                    "snippet": desc
                })
                if len(search_data) >= max_results:
                    break
        return search_data
    except Exception as e:
        print(f"⚠️ DuckDuckGo search failed: {e}", flush=True)
        return []

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

Return EXACTLY 20 results as a raw JSON array (no markdown fences, no explanation, just the array).
Each object must have these exact keys:
{{
  "university": "Full university name",
  "course": "Exact program/course name",
  "city": "City name",
  "country": "{country}",
  "degree": "{degree_label}",
  "link": "The exact URL to the course page. DO NOT invent or guess links. If the exact URL is not available in the search results, use the official university admissions homepage or domain homepage (e.g. https://www.uni-muenchen.de) instead.",
  "requirements": "Key admission requirements in 1-2 sentences",
  "match_rating": 3 (or 2, or 1) based on how well this program matches the student's profile (3 = Best match, 2 = Good match, 1 = Plausible match),
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
            "link":         clean_link(c.get("link", "")),
            "requirements": "See university website for full requirements.",
            "match_rating": 3 - (len(formatted) % 3),
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
                "match_rating": 3 - (i % 3),
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

    if not API_KEYS:
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
        response = generate_content_with_rotation(
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
        print(f"⚠️ Native news fetch failed: {e} — trying DuckDuckGo + gemini-flash-latest fallback...", flush=True)
        try:
            news_results = search_duckduckgo("international student visas study abroad scholarships news", max_results=8)
            news_context = ""
            for idx, res in enumerate(news_results):
                news_context += f"Result {idx+1}:\nTitle: {res['title']}\nURL: {res['link']}\nSnippet: {res['snippet']}\n\n"
            
            today_date = now.strftime("%B %d, %Y")
            ddg_news_prompt = f"""You are a news summarizer. Below are search results from DuckDuckGo matching recent news.
Use these results to extract 5-7 real, breaking news articles from TODAY or YESTERDAY about international student visas, study abroad scholarships, or university admissions worldwide.

SEARCH RESULTS FROM WEB:
{news_context}

Return EXACTLY a JSON array where each object has:
- "title": headline
- "source": domain name of source
- "date": e.g. '{today_date}' or 'Yesterday'
- "summary": 1 sentence summary
- "country": related country (or 'Global')
- "link": direct URL to the article

Return ONLY the JSON array (no markdown fences)."""

            response = generate_content_with_rotation(
                model="gemini-flash-latest",
                contents=ddg_news_prompt,
                config=None
            )
            results = extract_json_array(response.text)
            NEWS_CACHE["data"] = results
            NEWS_CACHE["timestamp"] = now
            return jsonify(results)
        except Exception as ddg_news_err:
            print(f"❌ News fallback failed: {ddg_news_err}", flush=True)
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
    if API_KEYS and country and field:
        try:
            prompt   = build_prompt(country, degree, field, profile)
            response = generate_content_with_rotation(
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
                    "link":         clean_link(r.get("link", "")),
                    "requirements": r.get("requirements", "See university website."),
                    "match_rating": r.get("match_rating", 3),
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
            print(f"⚠️ Native Google Search grounding failed: {err_msg} — trying DuckDuckGo + gemini-flash-latest fallback...", flush=True)
            
            try:
                # 1. Search DuckDuckGo
                query = f"universities offering {degree} in {field} in {country}"
                search_results = search_duckduckgo(query)
                search_context = ""
                for idx, res in enumerate(search_results):
                    search_context += f"Result {idx+1}:\nTitle: {res['title']}\nURL: {res['link']}\nSnippet: {res['snippet']}\n\n"
                
                # 2. Build new prompt with DDG context
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

                ddg_prompt = f"""You are a university admissions advisor. Below are search results from DuckDuckGo matching the student's criteria. Use these results to find real, currently available university programs that are accepting international students.

SEARCH RESULTS FROM WEB:
{search_context}

{profile_block}SEARCH CRITERIA:
- Country: {country}
- Degree level: {degree_label}
- Field of study: {field}

Return EXACTLY 20 results (or up to 20 if fewer are available in the search results) as a raw JSON array.
Each object must have these exact keys:
{{
  "university": "Full university name",
  "course": "Exact program/course name",
  "city": "City name",
  "country": "{country}",
  "degree": "{degree_label}",
  "link": "The exact URL to the course page from the search results. DO NOT invent or guess links. If the exact URL is not available in the search results, use the official university website homepage domain instead.",
  "requirements": "Key admission requirements in 1-2 sentences",
  "match_rating": 3 (or 2, or 1) based on how well this program matches the student's profile (3 = Best match, 2 = Good match, 1 = Plausible match),
  "intake": "e.g. Winter 2026 / Summer 2027",
  "fee": "Annual tuition fee if known, otherwise 'See website'"
}}

Only return the JSON array. Do not wrap it in markdown. Do not add commentary."""

                response = generate_content_with_rotation(
                    model="gemini-flash-latest",
                    contents=ddg_prompt,
                    config=None
                )
                results = extract_json_array(response.text)

                normalised = []
                for r in results:
                    normalised.append({
                        "university":   r.get("university", ""),
                        "course":       r.get("course", ""),
                        "city":         r.get("city", ""),
                        "country":      r.get("country", country),
                        "degree":       r.get("degree", degree),
                        "link":         clean_link(r.get("link", "")),
                        "requirements": r.get("requirements", "See university website."),
                        "match_rating": r.get("match_rating", 3),
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

            except Exception as ddg_err:
                print(f"❌ DuckDuckGo + gemini-flash-latest fallback failed: {ddg_err} — falling back to static data.", flush=True)

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
