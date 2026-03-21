/**
 * Web Search Skill — Perplexity API
 *
 * Usage from CLI: npx tsx skills/web_search.ts "your search query here"
 *
 * The Research Agent calls this via bash to search the web.
 */

import { config } from "dotenv";
config({ path: ".env.local" });

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;

async function search(query: string): Promise<string> {
  if (!PERPLEXITY_API_KEY) {
    return "ERROR: PERPLEXITY_API_KEY not set in .env.local";
  }

  const response = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${PERPLEXITY_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "sonar",
      messages: [
        {
          role: "system",
          content:
            "You are a research assistant. Provide detailed, factual answers with specific data points, numbers, and citations. Structure your response with clear sections.",
        },
        {
          role: "user",
          content: query,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    return `ERROR: Perplexity API returned ${response.status}: ${errorText}`;
  }

  const data = await response.json();
  const answer = data.choices?.[0]?.message?.content || "No results found.";
  const citations = data.citations || [];

  let result = answer;
  if (citations.length > 0) {
    result += "\n\n## Sources\n";
    for (const citation of citations) {
      result += `- ${citation}\n`;
    }
  }

  return result;
}

// CLI entry point
const query = process.argv.slice(2).join(" ");
if (!query) {
  console.error("Usage: npx tsx skills/web_search.ts <query>");
  process.exit(1);
}

search(query)
  .then((result) => console.log(result))
  .catch((err) => console.error("Search error:", err));
