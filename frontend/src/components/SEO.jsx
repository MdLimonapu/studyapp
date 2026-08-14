import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export default function SEO({
  title,
  description,
  keywords,
  canonical,
  noindex = false
}) {
  const location = useLocation()
  const currentPath = location.pathname
  const canonicalUrl = canonical || `https://studplex.com${currentPath === '/' ? '' : currentPath}`

  useEffect(() => {
    // 1. Title
    if (title) {
      document.title = title
    }

    // 2. Helper to set/update meta tag
    const setMetaTag = (selector, attrName, attrValue, content) => {
      if (!content) return
      let element = document.querySelector(selector)
      if (!element) {
        element = document.createElement('meta')
        element.setAttribute(attrName, attrValue)
        document.head.appendChild(element)
      }
      element.setAttribute('content', content)
    }

    // 3. Helper to set/update canonical link tag
    const setCanonical = (href) => {
      let element = document.querySelector('link[rel="canonical"]')
      if (!element) {
        element = document.createElement('link')
        element.setAttribute('rel', 'canonical')
        document.head.appendChild(element)
      }
      element.setAttribute('href', href)
    }

    // Meta descriptions and keywords
    setMetaTag('meta[name="description"]', 'name', 'description', description)
    if (keywords) {
      setMetaTag('meta[name="keywords"]', 'name', 'keywords', keywords)
    }

    // OpenGraph
    setMetaTag('meta[property="og:title"]', 'property', 'og:title', title)
    setMetaTag('meta[property="og:description"]', 'property', 'og:description', description)
    setMetaTag('meta[property="og:url"]', 'property', 'og:url', canonicalUrl)

    // Twitter
    setMetaTag('meta[name="twitter:title"]', 'name', 'twitter:title', title)
    setMetaTag('meta[name="twitter:description"]', 'name', 'twitter:description', description)

    // Robots indexing flag (prevents Soft 404s on 404 routes & private profile routes)
    setMetaTag('meta[name="robots"]', 'name', 'robots', noindex ? 'noindex, follow' : 'index, follow')

    // Self-referencing Canonical URL
    setCanonical(canonicalUrl)
  }, [title, description, keywords, canonicalUrl, noindex])

  return null
}
