const BASE_URL = "https://api.studplex.com";

export async function fetchCountries() {
  const res = await fetch(`${BASE_URL}/api/countries`);
  return res.json();
}

export async function fetchFields(country?: string) {
  const url = country
    ? `${BASE_URL}/api/fields?country=${encodeURIComponent(country)}`
    : `${BASE_URL}/api/fields`;
  const res = await fetch(url);
  return res.json();
}

export async function fetchProfile(email?: string) {
  const url = email 
    ? `${BASE_URL}/api/profile?email=${encodeURIComponent(email)}` 
    : `${BASE_URL}/api/profile`;
  const res = await fetch(url);
  return res.json();
}

export async function saveProfile(data: any) {
  const res = await fetch(`${BASE_URL}/api/profile`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function fetchNews() {
  const res = await fetch(`${BASE_URL}/api/news`);
  return res.json();
}

export async function searchCourses(form: any, profile?: any) {
  const res = await fetch(`${BASE_URL}/api/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...form, profile: profile || {} }),
  });
  return res.json();
}

export async function registerUser(data: any) {
  const res = await fetch(`${BASE_URL}/api/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}
