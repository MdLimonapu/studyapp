import re

def parse_fee_to_usd(fee_str, country="", degree=""):
    if not fee_str or not isinstance(fee_str, str):
        return None
        
    fee_str_lower = fee_str.lower().strip()
    if "none" in fee_str_lower or "free" in fee_str_lower:
        return 0.0
        
    # Standardize currency abbreviations and symbols
    # Rates (approximate static for studyapp conversions)
    rates = {
        "usd": 1.0,
        "$": 1.0,
        "sek": 0.096,
        "gbp": 1.28,
        "£": 1.28,
        "eur": 1.08,
        "€": 1.08,
        "jpy": 0.0064,
        "¥": 0.0064,
        "cad": 0.73,
        "aud": 0.66,
        "chf": 1.12
    }
    
    # Detect currency
    currency_rate = 1.0
    for cur, rate in rates.items():
        if cur in fee_str_lower:
            currency_rate = rate
            break
            
    # If no currency detected, guess based on country
    if currency_rate == 1.0 and country:
        c_lower = country.lower().strip()
        if "sweden" in c_lower:
            currency_rate = rates["sek"]
        elif "uk" in c_lower or "united kingdom" in c_lower:
            currency_rate = rates["gbp"]
        elif "france" in c_lower or "germany" in c_lower or "netherlands" in c_lower or "europe" in c_lower:
            currency_rate = rates["eur"]
        elif "japan" in c_lower:
            currency_rate = rates["jpy"]
        elif "canada" in c_lower:
            currency_rate = rates["cad"]
        elif "australia" in c_lower:
            currency_rate = rates["aud"]
        elif "switzerland" in c_lower:
            currency_rate = rates["chf"]

    # Extract all numbers/ranges from the string
    # Remove commas/spaces in numbers first (e.g. 140,000 -> 140000, 12 000 -> 12000)
    clean_str = re.sub(r'(?<=\d)[,\s](?=\d)', '', fee_str_lower)
    numbers = [float(n) for n in re.findall(r'\d+', clean_str)]
    
    if not numbers:
        return None
        
    # If there is a range, take the max number (or average, let's take max to be conservative)
    max_val = max(numbers)
    return max_val * currency_rate

# Test cases
test_cases = [
    ("SEK 140000", "Sweden"),
    ("SEK 780000", "Sweden"),
    ("€8,000 - €15,000 / year", "Germany"),
    ("£16,000 - £26,000 / year", "UK"),
    ("CAD 22,000 - 38,000 / year", "Canada"),
    ("¥535,800 / year (~$3,500)", "Japan"),
    ("¥800,000 - ¥1,400,000 / year", "Japan"),
    ("None (Semester contribution ~€200 - €400)", "Germany"),
    ("€2,770 / year (State rate)", "France"),
    ("41274-45205", "Canada"), # raw range from UniversityStudy.ca
]

for fee, country in test_cases:
    usd = parse_fee_to_usd(fee, country)
    print(f"Fee: {fee:<40} Country: {country:<10} -> USD: {usd}")
