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

RSS_URL = "https://news.google.com/rss/search?q=study+abroad+student+visa+news+updates&hl=en-US&gl=US&ceid=US:en"

def fetch_rss_news():
    try:
        print("Fetching RSS feed from Google News...", flush=True)
        req = urllib.request.Request(
            RSS_URL, 
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
        )
        with urllib.request.urlopen(req) as response:
            xml_data = response.read()
        
        root = ET.fromstring(xml_data)
        items = []
        for item in root.findall('.//item')[:15]:  # Get top 15 news items
            title = item.find('title').text if item.find('title') is not None else ""
            link = item.find('link').text if item.find('link') is not None else ""
            pub_date = item.find('pubDate').text if item.find('pubDate') is not None else ""
            items.append({
                "raw_title": title,
                "link": link,
                "pub_date": pub_date
            })
        print(f"Fetched {len(items)} articles successfully.", flush=True)
        return items
    except Exception as e:
        print(f"Error fetching RSS: {e}", flush=True)
        return []

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

For the relevant articles (up to 8-10 max), summarize them and output a clean JSON list matching this structure:
{{
  "news": [
    {{
      "title": "Clear, concise, professional headline about the visa policy or study update",
      "source": "Website name (e.g. Times Higher Education, PIE News, Canada.ca)",
      "date": "Month Year (e.g., May 2026)",
      "summary": "1-2 sentence summary of what this means for students, written in a clear and helpful tone.",
      "country": "The primary country concerned (e.g., Germany, UK, Canada, USA, France, etc. Use 'Global' if general)",
      "link": "The article URL"
    }}
  ]
}}

Raw Articles to Process:
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

def fallback_process(raw_news):
    news = []
    for item in raw_news:
        title = item["raw_title"]
        source = "Google News"
        if " - " in title:
            parts = title.rsplit(" - ", 1)
            title = parts[0]
            source = parts[1]
            
        news.append({
            "title": title,
            "source": source,
            "date": "Today",
            "summary": "Latest updates regarding study abroad and student visas.",
            "country": "Global",
            "link": item["link"]
        })
    return news

def main():
    raw_news = fetch_rss_news()
    if not raw_news:
        print("No news fetched. Exiting.", flush=True)
        return
        
    if API_KEY:
        processed_news = summarize_with_gemini(raw_news)
    else:
        print("⚠️ GEMINI_API_KEY not found in environment. Using RSS title parsing fallback...", flush=True)
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
