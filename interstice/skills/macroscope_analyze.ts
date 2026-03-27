/**
 * Macroscope Analyze Skill — Codebase analysis (PRIZE: $1,750)
 *
 * Usage from CLI: npx tsx skills/macroscope_analyze.ts "owner/repo"
 *
 * Analyzes a GitHub repo via Macroscope and returns structured
 * product understanding (tech stack, features, architecture).
 *
 * Required env vars in .env.local:
 *   MACROSCOPE_API_KEY — Macroscope API key
 */

import { config } from "dotenv";
config({ path: ".env.local" });

const MACROSCOPE_API_KEY = process.env.MACROSCOPE_API_KEY;
const MACROSCOPE_API_URL = process.env.MACROSCOPE_API_URL || "https://api.macroscope.com";

interface MacroscopeResult {
  success: boolean;
  analysis?: {
    techStack?: string[];
    features?: string[];
    architecture?: string;
    summary?: string;
  };
  message: string;
}

/**
 * Analyze a GitHub repository and return structured product understanding.
 */
export async function analyzeRepo(repoSlug: string): Promise<MacroscopeResult> {
  if (!MACROSCOPE_API_KEY) {
    return {
      success: false,
      message: "ERROR: MACROSCOPE_API_KEY not set in .env.local. Get one at https://macroscope.com",
    };
  }

  console.log(`[macroscope] Analyzing repository: ${repoSlug}...`);

  const response = await fetch(`${MACROSCOPE_API_URL}/v1/analyze`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${MACROSCOPE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      repository: repoSlug,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    return {
      success: false,
      message: `ERROR: Macroscope API returned ${response.status}: ${errorText}`,
    };
  }

  const data = await response.json();

  return {
    success: true,
    analysis: {
      techStack: data.tech_stack || data.techStack,
      features: data.features,
      architecture: data.architecture,
      summary: data.summary,
    },
    message: `Analysis complete for ${repoSlug}. Tech stack: ${(data.tech_stack || data.techStack || []).join(", ")}. ${data.summary || ""}`,
  };
}

/**
 * Get analysis status for a previously submitted repo.
 */
export async function getAnalysisStatus(analysisId: string): Promise<MacroscopeResult> {
  if (!MACROSCOPE_API_KEY) {
    return { success: false, message: "ERROR: MACROSCOPE_API_KEY not set in .env.local" };
  }

  const response = await fetch(`${MACROSCOPE_API_URL}/v1/analyze/${analysisId}`, {
    headers: {
      Authorization: `Bearer ${MACROSCOPE_API_KEY}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    return {
      success: false,
      message: `ERROR: Macroscope API returned ${response.status}: ${errorText}`,
    };
  }

  const data = await response.json();

  return {
    success: true,
    analysis: data,
    message: `Analysis ${analysisId}: ${data.status || "complete"}.`,
  };
}

// CLI entry point
if (process.argv[1] && process.argv[1].includes("macroscope_analyze")) {
  const repoSlug = process.argv[2];

  if (!repoSlug) {
    console.error("Usage: npx tsx skills/macroscope_analyze.ts <owner/repo>");
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
