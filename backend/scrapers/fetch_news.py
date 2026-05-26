import os
import json
import xml.etree.ElementTree as ET
import urllib.request
import ssl
from dotenv import load_dotenv
from google import genai
from google.genai import types

# Bypass SSL verify for macOS urllib environments
ssl._create_default_https_context = ssl._create_unverified_context

# Load env from parent directory
load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"))
API_KEY = os.environ.get("GEMINI_API_KEY")

COUNTRIES = ["Germany", "UK", "USA", "Canada", "Australia", "Netherlands", "Sweden", "France", "Switzerland", "Japan"]

def fetch_rss_news():
    all_items = []
    for country in COUNTRIES:
        urls = [
            f"https://news.google.com/rss/search?q=student+visa+study+abroad+{country}+when:7d&hl=en-US&gl=US&ceid=US:en",
            f"https://news.google.com/rss/search?q=student+visa+study+abroad+{country}&hl=en-US&gl=US&ceid=US:en"
        ]
        
        country_items = []
        for url in urls:
            try:
                print(f"Fetching RSS feed for {country}: {url}", flush=True)
                req = urllib.request.Request(
                    url, 
                    headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
                )
                with urllib.request.urlopen(req) as response:
                    xml_data = response.read()
                
                root = ET.fromstring(xml_data)
                for item in root.findall('.//item')[:2]:  # Get top 2 articles per country
                    title = item.find('title').text if item.find('title') is not None else ""
                    link = item.find('link').text if item.find('link') is not None else ""
                    pub_date = item.find('pubDate').text if item.find('pubDate') is not None else ""
                    country_items.append({
                        "raw_title": title,
                        "link": link,
                        "pub_date": pub_date,
                        "search_country": country
                    })
                if country_items:
                    print(f"Successfully fetched {len(country_items)} articles for {country}.", flush=True)
                    break
            except Exception as e:
                print(f"Error fetching RSS for {country} from {url}: {e}", flush=True)
                
        all_items.extend(country_items)
        
    print(f"Total articles fetched across all countries: {len(all_items)}", flush=True)
    return all_items

def summarize_with_gemini(raw_news):
    if not API_KEY:
        print("❌ GEMINI_API_KEY not found in environment.", flush=True)
        return []
    
    if not raw_news:
        print("No raw news items to process.", flush=True)
        return []
        
    client = genai.Client(api_key=API_KEY)
    
    prompt = f"""
You are a study abroad counselor. Analyze the following list of study visa and study abroad news articles from a Google News RSS feed.
Filter out articles that are not directly relevant to international students, visa policies, scholarships, or study abroad country updates.

For the relevant articles, summarize them and output a clean JSON list matching this structure:
{{
  "news": [
    {{
      "title": "Clear, concise, professional headline about the visa policy or study update",
      "source": "Website name (e.g. Times Higher Education, PIE News, Canada.ca)",
      "date": "Month Year (e.g., May 2026)",
      "summary": "1-2 sentence summary of what this means for students, written in a clear and helpful tone.",
      "country": "The primary country concerned (e.g., Germany, UK, Canada, USA, France, etc.)",
      "link": "The article URL"
    }}
  ]
}}

Raw Articles to Process (each article has an associated search_country. Ensure you set "country" to that search_country or the actual target country):
{json.dumps(raw_news, indent=2)}

Return ONLY valid JSON. Do not include markdown code block formatting (such as ```json) in your final output.
"""
    try:
        print("Processing news items with Gemini...", flush=True)
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.2
            )
        )
        
        # Clean response if LLM wrapped it in markdown code block
        text = response.text.strip()
        if text.startswith("```"):
            lines = text.split("\n")
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines[-1].startswith("```"):
                lines = lines[:-1]
            text = "\n".join(lines).strip()
            
        data = json.loads(text)
        return data.get("news", [])
    except Exception as e:
        print(f"Error calling Gemini: {e}", flush=True)
        return []

def extract_country_from_title(title):
    import re
    title_lower = title.lower()
    if any(k in title_lower for k in ["germany", "german", "daad"]):
        return "Germany"
    if any(k in title_lower for k in ["uk", "united kingdom", "british", "london", "oxford", "cambridge"]):
        return "UK"
    if re.search(r'\b(us|usa|united states|america|american|harvard|yale|mit)\b', title_lower):
        return "USA"
    if any(k in title_lower for k in ["canada", "canadian", "toronto", "vancouver", "mcgill"]):
        return "Canada"
    if any(k in title_lower for k in ["australia", "australian", "sydney", "melbourne"]):
        return "Australia"
    if any(k in title_lower for k in ["netherlands", "dutch", "holland", "amsterdam"]):
        return "Netherlands"
    if any(k in title_lower for k in ["sweden", "swedish", "stockholm"]):
        return "Sweden"
    if any(k in title_lower for k in ["france", "french", "paris"]):
        return "France"
    if any(k in title_lower for k in ["switzerland", "swiss", "zurich"]):
        return "Switzerland"
    if any(k in title_lower for k in ["japan", "japanese", "tokyo"]):
        return "Japan"
    if any(k in title_lower for k in ["europe", "european", "eu"]):
        return "Europe"
    return "Global"

def get_country_summary(country):
    if country == "Global":
        return "Latest updates regarding study abroad and student visas globally."
    elif country in ["UK", "USA", "Netherlands"]:
        return f"Latest updates regarding study abroad and student visas in the {country}."
    else:
        return f"Latest updates regarding study abroad and student visas in {country}."

def fallback_process(raw_news):
    news = []
    for item in raw_news:
        title = item["raw_title"]
        source = "Google News"
        if " - " in title:
            parts = title.rsplit(" - ", 1)
            title = parts[0]
            source = parts[1]
            
        country = extract_country_from_title(title)
        summary = get_country_summary(country)
            
        news.append({
            "title": title,
            "source": source,
            "date": "Today",
            "summary": summary,
            "country": country,
            "link": item["link"]
        })
    return news

def main():
    raw_news = fetch_rss_news()
    if not raw_news:
        print("No news fetched. Exiting.", flush=True)
        return
        
    processed_news = []
    if API_KEY:
        processed_news = summarize_with_gemini(raw_news)
        
    if not processed_news:
        print("⚠️ Gemini processing was skipped, failed, or hit rate limits. Falling back to direct RSS parsing...", flush=True)
        processed_news = fallback_process(raw_news)
        
    if not processed_news:
        print("No news items processed. Exiting.", flush=True)
        return
        
    # Write to data directory
    data_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
    os.makedirs(data_dir, exist_ok=True)
    
    cache_path = os.path.join(data_dir, "news_cache.json")
    with open(cache_path, "w") as f:
        json.dump(processed_news, f, indent=2)
        
    print(f"Successfully updated news cache! Saved {len(processed_news)} items to {cache_path}", flush=True)

if __name__ == "__main__":
    main()
