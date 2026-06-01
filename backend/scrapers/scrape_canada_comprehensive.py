#!/usr/bin/env python3
import subprocess
import json
import os
import time
from datetime import date
from concurrent.futures import ThreadPoolExecutor, as_completed

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DATA_DIR = os.path.join(ROOT, "data")
TODAY = date.today().isoformat()
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"

URL_PROGRAMS = "https://universitystudy.ca/wp-json/custom/v1/external-api/programs"
URL_SINGLE = "https://universitystudy.ca/wp-json/custom/v1/external-api/programs-single"

PROGRESS_FILE = os.path.join(DATA_DIR, "canada_raw_list.json")
COURSES_OUTPUT = os.path.join(DATA_DIR, "canada.json")

def fetch_page_with_curl_retry(p_number, retries=1, delay=1):
    payload = {
        "p_number": p_number,
        "language": "en",
        "site_lang": "en"
    }
    cmd = [
        "curl", "-s", "-X", "POST",
        "-H", "Content-Type: application/json",
        "-H", "Origin: https://universitystudy.ca",
        "-H", "Referer: https://universitystudy.ca/programs/",
        "-d", json.dumps(payload),
        URL_PROGRAMS
    ]
    for attempt in range(retries):
        try:
            res = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
            if res.returncode == 0:
                data = json.loads(res.stdout)
                results = data.get("search_results", [])
                if results:
                    print(f"  -> Page {p_number} success ({len(results)} items)", flush=True)
                    return results
            time.sleep(delay)
        except Exception as e:
            time.sleep(delay)
    print(f"  -> Page {p_number} FAILED / Timed out", flush=True)
    return []

def fetch_single_detail_with_curl_retry(program_item, retries=1, delay=0.5):
    prog_id = program_item.get("id")
    if not prog_id:
        return None
        
    payload = {
        "program_id": str(prog_id),
        "site_lang": "en"
    }
    cmd = [
        "curl", "-s", "-X", "POST",
        "-H", "Content-Type: application/json",
        "-H", "Origin: https://universitystudy.ca",
        "-H", "Referer: https://universitystudy.ca/programs/",
        "-d", json.dumps(payload),
        URL_SINGLE
    ]
    for attempt in range(retries):
        try:
            res = subprocess.run(cmd, capture_output=True, text=True, timeout=8)
            if res.returncode == 0:
                detail = json.loads(res.stdout)
                prog_detail = detail.get("program", [{}])[0]
                uni_detail = detail.get("university", [{}])[0]
                
                # Determine degree type
                level_desc = str(prog_detail.get("program_level_description", "")).lower()
                prog_name = str(prog_detail.get("program_name", "")).strip()
                
                degree = "Bachelor"
                if "master" in level_desc or "maîtrise" in level_desc or "graduate diploma" in level_desc:
                    degree = "Master"
                elif "doctor" in level_desc or "phd" in level_desc or "doctorat" in level_desc:
                    degree = "PhD"
                elif "bachelor" in level_desc or "baccalauréat" in level_desc:
                    degree = "Bachelor"
                else:
                    if "master" in prog_name.lower() or "msc" in prog_name.lower() or "mba" in prog_name.lower():
                        degree = "Master"
                    elif "phd" in prog_name.lower() or "doctor" in prog_name.lower():
                        degree = "PhD"
                        
                # Parse tuition fee
                fees = uni_detail.get("tuition_fees", {})
                fee_str = ""
                
                if degree == "Bachelor":
                    undergrad_fee = fees.get("international_undergraduate") or fees.get("regular_undergraduate")
                    if undergrad_fee:
                        fee_str = f"CAD {undergrad_fee}"
                else:
                    grad_fee = fees.get("international_graduate") or fees.get("regular_graduate")
                    if grad_fee:
                        fee_str = f"CAD {grad_fee}"
                        
                direct_link = prog_detail.get("program_url") or uni_detail.get("url") or f"https://universitystudy.ca/program/?id={prog_id}"
                
                return {
                    "country": "Canada",
                    "uni": uni_detail.get("name") or program_item.get("university", ""),
                    "course": prog_name,
                    "degree": degree,
                    "city": uni_detail.get("city") or program_item.get("location", ""),
                    "link": direct_link,
                    "fee": fee_str,
                    "source": "Universities Canada (UniversityStudy.ca)",
                    "source_url": f"https://universitystudy.ca/program/?id={prog_id}",
                    "verified_at": TODAY
                }
            time.sleep(delay)
        except Exception:
            time.sleep(delay)
            
    return {
        "country": "Canada",
        "uni": program_item.get("university", ""),
        "course": program_item.get("program_name", ""),
        "degree": "Bachelor", 
        "city": program_item.get("location", ""),
        "link": f"https://universitystudy.ca/program/?id={prog_id}",
        "fee": "",
        "source": "Universities Canada (UniversityStudy.ca)",
        "source_url": f"https://universitystudy.ca/program/?id={prog_id}",
        "verified_at": TODAY
    }

def main():
    print("🇨🇦 Starting Comprehensive, Curl-based Canada Scraper...", flush=True)
    
    # Fetch metadata
    cmd_meta = [
        "curl", "-s", "-X", "POST",
        "-H", "Content-Type: application/json",
        "-d", '{"p_number":1,"language":"en","site_lang":"en"}',
        URL_PROGRAMS
    ]
    total_pages = 1344
    try:
        res = subprocess.run(cmd_meta, capture_output=True, text=True, timeout=12)
        if res.returncode == 0:
            res_data = json.loads(res.stdout)
            pagination = res_data.get("pagination", {})
            total_pages = pagination.get("total_pages", 1344)
            print(f"Total English program pages to fetch: {total_pages} ({pagination.get('total_results')} programs)", flush=True)
    except Exception as e:
        print(f"Failed to fetch metadata, defaulting to 1344 pages: {e}", flush=True)

    all_programs = []
    if os.path.exists(PROGRESS_FILE):
        try:
            with open(PROGRESS_FILE, "r") as f:
                all_programs = json.load(f)
            print(f"Resumed from {PROGRESS_FILE} with {len(all_programs)} program summaries.", flush=True)
        except Exception:
            pass

    if not all_programs:
        # Stage 1: Fetch program summaries with polite low concurrency (4 workers)
        print("Fetching page summaries...", flush=True)
        chunk_size = 20
        for i in range(1, total_pages + 1, chunk_size):
            end_page = min(i + chunk_size, total_pages + 1)
            print(f"  Fetching pages {i} to {end_page-1}...", flush=True)
            with ThreadPoolExecutor(max_workers=4) as executor:
                futures = {executor.submit(fetch_page_with_curl_retry, p): p for p in range(i, end_page)}
                for fut in as_completed(futures):
                    page_results = fut.result()
                    all_programs.extend(page_results)
            time.sleep(0.5)
            with open(PROGRESS_FILE, "w", encoding="utf-8") as f:
                json.dump(all_programs, f, indent=2, ensure_ascii=False)
                
        print(f"Finished fetching summaries. Total: {len(all_programs)}", flush=True)

    # Stage 2: Fetch details for each program
    print("Fetching program details (tuition fees & deep links)...", flush=True)
    courses = []
    seen = set()
    
    if os.path.exists(COURSES_OUTPUT):
        try:
            with open(COURSES_OUTPUT, "r") as f:
                courses = json.load(f)
            for c in courses:
                key = (c["uni"].lower(), c["course"].lower(), c["degree"].lower())
                seen.add(key)
            print(f"Loaded {len(courses)} existing resolved courses from output.", flush=True)
        except Exception:
            pass

    processed_ids = set()
    for c in courses:
        src_url = c.get("source_url", "")
        if "=" in src_url:
            processed_ids.add(src_url.split("=")[-1])

    remaining_programs = [p for p in all_programs if str(p.get("id")) not in processed_ids]
    print(f"Remaining programs to resolve details for: {len(remaining_programs)} / {len(all_programs)}", flush=True)
    
    if remaining_programs:
        chunk_size = 50
        for idx in range(0, len(remaining_programs), chunk_size):
            chunk = remaining_programs[idx:idx+chunk_size]
            print(f"  Resolving details {idx} to {idx+len(chunk)} of {len(remaining_programs)}...", flush=True)
            
            with ThreadPoolExecutor(max_workers=6) as executor:
                futures = {executor.submit(fetch_single_detail_with_curl_retry, prog): prog for prog in chunk}
                for fut in as_completed(futures):
                    res_course = fut.result()
                    if res_course:
                        key = (res_course["uni"].lower(), res_course["course"].lower(), res_course["degree"].lower())
                        if key not in seen:
                            seen.add(key)
                            courses.append(res_course)
                            
            with open(COURSES_OUTPUT, "w", encoding="utf-8") as f:
                json.dump(courses, f, indent=2, ensure_ascii=False)
            time.sleep(0.5)

    if len(courses) >= len(all_programs) - 20:
        if os.path.exists(PROGRESS_FILE):
            try:
                os.remove(PROGRESS_FILE)
            except Exception:
                pass

    print(f"Completed! Saved {len(courses)} Canada courses to {COURSES_OUTPUT}", flush=True)

if __name__ == "__main__":
    main()
