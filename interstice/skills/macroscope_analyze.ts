/**
 * Macroscope Analyze Skill — Codebase analysis (PRIZE: $1,750)
 *
 * Usage from CLI: npx tsx skills/macroscope_analyze.ts "owner/repo"
 *
 * Macroscope is a GitHub App (not a REST API). It's installed on repos via
 * github.com/apps/macroscopeapp and provides codebase understanding.
 *
 * This skill uses the GitHub API to fetch repo metadata, languages, and
 * README content, then structures it into a product analysis the Content
 * Agent can use for marketing copy.
 *
 * No API key required — uses public GitHub API (unauthenticated for public repos,
 * or GITHUB_TOKEN for private repos).
 */

import { config } from "dotenv";
config({ path: ".env.local" });

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

interface MacroscopeResult {
  success: boolean;
  analysis?: {
    name: string;
    description: string;
    techStack: string[];
    features: string[];
    architecture: string;
    summary: string;
    stars: number;
    language: string;
    topics: string[];
  };
  message: string;
}

function githubHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "interstice-agent",
  };
  if (GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${GITHUB_TOKEN}`;
  }
  return headers;
}

/**
 * Analyze a GitHub repository by fetching its metadata, languages, and README.
 * Returns structured product understanding for the Content Agent.
 */
export async function analyzeRepo(repoSlug: string): Promise<MacroscopeResult> {
  // Normalize: accept full URLs or owner/repo format
  const slug = repoSlug
    .replace(/^https?:\/\/github\.com\//, "")
    .replace(/\.git$/, "")
    .replace(/\/$/, "");

  console.log(`[macroscope] Analyzing repository: ${slug}...`);

  // Fetch repo metadata
  const repoRes = await fetch(`https://api.github.com/repos/${slug}`, {
    headers: githubHeaders(),
  });

  if (!repoRes.ok) {
    return {
      success: false,
      message: `ERROR: GitHub API returned ${repoRes.status} for ${slug}. ${repoRes.status === 404 ? "Repo not found or private (set GITHUB_TOKEN for private repos)." : await repoRes.text()}`,
    };
  }

  const repo = await repoRes.json();

  // Fetch languages
  const langsRes = await fetch(`https://api.github.com/repos/${slug}/languages`, {
    headers: githubHeaders(),
  });
  const languages: Record<string, number> = langsRes.ok ? await langsRes.json() : {};
  const techStack = Object.keys(languages);

  // Fetch README
  let readme = "";
  const readmeRes = await fetch(`https://api.github.com/repos/${slug}/readme`, {
    headers: { ...githubHeaders(), Accept: "application/vnd.github.v3.raw" },
  });
  if (readmeRes.ok) {
    readme = await readmeRes.text();
    if (readme.length > 3000) readme = readme.slice(0, 3000) + "\n...(truncated)";
  }

  // Fetch topics
  const topics: string[] = repo.topics || [];

  // Extract features from README (look for headers, bullet points)
  const features: string[] = [];
  const featureRegex = /^[-*]\s+\*?\*?(.+?)\*?\*?\s*$/gm;
  let match;
  while ((match = featureRegex.exec(readme)) !== null && features.length < 10) {
    const feat = match[1].trim();
    if (feat.length > 10 && feat.length < 200) {
      features.push(feat);
    }
  }

  // Build architecture summary from language distribution
  const totalBytes = Object.values(languages).reduce((a, b) => a + b, 0);
  const langBreakdown = Object.entries(languages)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([lang, bytes]) => `${lang} (${Math.round((bytes / totalBytes) * 100)}%)`)
    .join(", ");

  const architecture = `${repo.name} is a ${repo.private ? "private" : "public"} repository with ${repo.size}KB of code. Language distribution: ${langBreakdown || "unknown"}. ${repo.fork ? "This is a fork." : ""} Created ${new Date(repo.created_at).toLocaleDateString()}, last updated ${new Date(repo.updated_at).toLocaleDateString()}.`;

  const summary = repo.description
    || (readme.split("\n").find((l: string) => l.trim().length > 20 && !l.startsWith("#")) || "")
    || `A ${techStack[0] || "software"} project on GitHub.`;

  return {
    success: true,
    analysis: {
      name: repo.full_name,
      description: repo.description || summary,
      techStack,
      features,
      architecture,
      summary: typeof summary === "string" ? summary.slice(0, 500) : String(summary),
      stars: repo.stargazers_count,
      language: repo.language || "Unknown",
      topics,
    },
    message: `Analysis complete for ${slug}. ${techStack.length} languages detected: ${techStack.join(", ")}. ${features.length} features extracted from README. ${repo.stargazers_count} stars.`,
  };
}

// CLI entry point
if (process.argv[1] && process.argv[1].includes("macroscope_analyze")) {
  const repoSlug = process.argv[2];

  if (!repoSlug) {
    console.error("Usage: npx tsx skills/macroscope_analyze.ts <owner/repo or GitHub URL>");
    process.exit(1);
  }

  analyzeRepo(repoSlug)
    .then((result) => {
      console.log(result.message);
      if (result.analysis) console.log(JSON.stringify(result.analysis, null, 2));
      if (!result.success) process.exit(1);
    })
    .catch((err) => {
      console.error("Macroscope error:", err);
      process.exit(1);
    });
}
