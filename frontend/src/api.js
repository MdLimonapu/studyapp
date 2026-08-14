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

export async function fetchProfile(email) {
  const url = email 
    ? `${BASE_URL}/api/profile?email=${encodeURIComponent(email)}` 
    : `${BASE_URL}/api/profile`;
  const res = await fetch(url);
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

export async function fetchCustomProducts() {
  try {
    const res = await fetch(`${BASE_URL}/api/products`);
    if (!res.ok) return [];
    return await res.json();
  } catch (e) {
    return [];
  }
}

export async function extractProductFromUrl(url) {
  const res = await fetch(`${BASE_URL}/api/products/extract`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  return res.json();
}

export async function addCustomProduct(product) {
  const res = await fetch(`${BASE_URL}/api/products/add`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ product }),
  });
  return res.json();
}

export async function deleteCustomProduct(id) {
  const res = await fetch(`${BASE_URL}/api/products/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  return res.json();
}

export async function uploadProductImage(file) {
  const formData = new FormData();
  formData.append('image', file);
  const res = await fetch(`${BASE_URL}/api/products/upload-image`, {
    method: "POST",
    body: formData,
  });
  return res.json();
}

export async function updateProduct(id, updates) {
  const res = await fetch(`${BASE_URL}/api/products/update`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, updates }),
  });
  return res.json();
}
