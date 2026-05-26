const BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:5001";

export async function fetchCountries() {
  const res = await fetch(`${BASE_URL}/api/countries`);
  return res.json();
}

export async function fetchFields(country) {
  const url = country
    ? `${BASE_URL}/api/fields?country=${encodeURIComponent(country)}`
    : `${BASE_URL}/api/fields`;
  const res = await fetch(url);
  return res.json();
}

export async function fetchProfile() {
  const res = await fetch(`${BASE_URL}/api/profile`);
  return res.json();
}

export async function saveProfile(data) {
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

export async function searchCourses(form, profile) {
  const res = await fetch(`${BASE_URL}/api/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...form, profile: profile || {} }),
  });
  return res.json();
}

export async function registerUser(data) {
  const res = await fetch(`${BASE_URL}/api/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

