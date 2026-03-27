/**
 * Scrape Product Skill — Product URL scraper
 *
 * Usage from CLI: npx tsx skills/scrape_product.ts "https://example.com/product"
 *
 * Scrapes a product URL and extracts structured data:
 * name, description, features, pricing, target audience.
 *
 * No API key needed — uses fetch + basic HTML parsing.
 */

import { config } from "dotenv";
config({ path: ".env.local" });

interface ProductData {
  name: string;
  description: string;
  features: string[];
  pricing: string;
  targetAudience: string;
  url: string;
}

interface ScrapeResult {
  success: boolean;
  product?: ProductData;
  rawText?: string;
  message: string;
}

/**
 * Scrape a product page and extract structured information.
 */
export async function scrapeProduct(url: string): Promise<ScrapeResult> {
  if (!url.startsWith("http")) {
    return { success: false, message: `ERROR: Invalid URL — must start with http(s). Got: ${url}` };
  }

  console.log(`[scrape_product] Fetching: ${url}`);

  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; Interstice/1.0; +https://interstice.ai)",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
  });

  if (!response.ok) {
    return {
      success: false,
      message: `ERROR: HTTP ${response.status} fetching ${url}`,
    };
  }

  const html = await response.text();

  // Extract text content from HTML
  const textContent = extractText(html);

  // Extract structured data
  const product = extractProductData(html, textContent, url);

  return {
    success: true,
    product,
    rawText: textContent.substring(0, 2000),
    message: `Scraped "${product.name}" from ${url}. Found ${product.features.length} features.`,
  };
}

function extractText(html: string): string {
  return html
    // Remove scripts and styles
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    // Remove HTML tags
    .replace(/<[^>]+>/g, " ")
    // Decode common entities
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    // Clean whitespace
    .replace(/\s+/g, " ")
    .trim();
}

function extractProductData(html: string, text: string, url: string): ProductData {
  // Extract title
  const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
  const h1Match = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
  const ogTitle = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]*)"[^>]*>/i);
  const name = cleanTag(ogTitle?.[1] || h1Match?.[1] || titleMatch?.[1] || "Unknown Product");

  // Extract description
  const ogDesc = html.match(/<meta[^>]*property="og:description"[^>]*content="([^"]*)"[^>]*>/i);
  const metaDesc = html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"[^>]*>/i);
  const description = ogDesc?.[1] || metaDesc?.[1] || text.substring(0, 300);

  // Extract features (look for lists near keywords)
  const features: string[] = [];
  const featurePatterns = [
    /<li[^>]*>(.*?)<\/li>/gi,
    /(?:feature|benefit|include)[s]?:?\s*([^\n.]+)/gi,
  ];

  for (const pattern of featurePatterns) {
    let match;
    while ((match = pattern.exec(html)) !== null && features.length < 10) {
      const cleaned = cleanTag(match[1]).trim();
      if (cleaned.length > 10 && cleaned.length < 200) {
        features.push(cleaned);
      }
    }
  }

  // Extract pricing
  const pricePatterns = [
    /\$[\d,]+(?:\.\d{2})?(?:\s*\/\s*(?:mo|month|yr|year))?/gi,
    /(?:price|pricing|cost|plan)[s]?:?\s*([^\n]+)/gi,
  ];
  let pricing = "Not found";
  for (const pattern of pricePatterns) {
    const match = pattern.exec(text);
    if (match) {
      pricing = match[0].trim();
      break;
    }
  }

  // Guess target audience from text
  const audiencePatterns = [
    /(?:for|built for|designed for|perfect for|ideal for)\s+([^.]+)/i,
    /(?:teams|businesses|developers|creators|marketers|entrepreneurs|startups)/i,
  ];
  let targetAudience = "General";
  for (const pattern of audiencePatterns) {
    const match = pattern.exec(text);
    if (match) {
      targetAudience = match[1]?.trim() || match[0].trim();
      break;
    }
  }

  return { name, description, features: features.slice(0, 8), pricing, targetAudience, url };
}

function cleanTag(s: string): string {
  return s.replace(/<[^>]+>/g, "").trim();
}

// CLI entry point
if (process.argv[1] && process.argv[1].includes("scrape_product")) {
  const url = process.argv[2];

  if (!url) {
    console.error("Usage: npx tsx skills/scrape_product.ts <url>");
    process.exit(1);
  }

  scrapeProduct(url)
    .then((result) => {
      console.log(result.message);
      if (result.product) {
        console.log("\n## Product Data");
        console.log(`Name: ${result.product.name}`);
        console.log(`Description: ${result.product.description}`);
        console.log(`Pricing: ${result.product.pricing}`);
        console.log(`Target Audience: ${result.product.targetAudience}`);
        console.log(`Features:`);
        result.product.features.forEach((f) => console.log(`  - ${f}`));
      }
      if (!result.success) process.exit(1);
    })
    .catch((err) => {
      console.error("Scrape error:", err);
      process.exit(1);
    });
}
