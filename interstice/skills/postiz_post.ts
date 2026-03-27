/**
 * Postiz Post Skill — Social media posting via Postiz API
 *
 * Usage from CLI: npx tsx skills/postiz_post.ts "Post content here"
 *
 * Uploads TikTok slideshows, tweets, and LinkedIn posts as drafts via Postiz.
 *
 * Required env vars in .env.local:
 *   POSTIZ_API_KEY        — Postiz API key
 *   POSTIZ_API_URL        — Postiz API URL (default: https://api.postiz.com/public/v1)
 *   POSTIZ_INTEGRATION_ID — Postiz integration/channel ID for posting
 */

import { config } from "dotenv";
config({ path: ".env.local" });

const POSTIZ_API_KEY = process.env.POSTIZ_API_KEY;
const POSTIZ_API_URL = process.env.POSTIZ_API_URL || "https://api.postiz.com/public/v1";
const POSTIZ_INTEGRATION_ID = process.env.POSTIZ_INTEGRATION_ID;

interface PostizResult {
  success: boolean;
  postId?: string;
  message: string;
}

/**
 * Create a text post draft on Postiz.
 */
export async function createPost(
  content: string,
  options?: {
    integrationId?: string;
    scheduleDate?: string;
    mediaUrls?: string[];
    type?: "tiktok" | "twitter" | "linkedin" | "generic";
  }
): Promise<PostizResult> {
  if (!POSTIZ_API_KEY) {
    return {
      success: false,
      message: "ERROR: POSTIZ_API_KEY not set in .env.local. Get one at https://app.postiz.com",
    };
  }

  const integrationId = options?.integrationId || POSTIZ_INTEGRATION_ID;
  if (!integrationId) {
    return {
      success: false,
      message: "ERROR: POSTIZ_INTEGRATION_ID not set. Configure a Postiz integration first.",
    };
  }

  console.log(`[postiz_post] Creating ${options?.type || "generic"} post draft...`);

  const body: Record<string, unknown> = {
    content,
    integration: integrationId,
    status: "draft",
  };

  if (options?.scheduleDate) {
    body.scheduleDate = options.scheduleDate;
    body.status = "scheduled";
  }

  if (options?.mediaUrls && options.mediaUrls.length > 0) {
    body.media = options.mediaUrls.map((url) => ({ url }));
  }

  const response = await fetch(`${POSTIZ_API_URL}/posts`, {
    method: "POST",
    headers: {
      Authorization: POSTIZ_API_KEY!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    return {
      success: false,
      message: `ERROR: Postiz API returned ${response.status}: ${errorText}`,
    };
  }

  const data = await response.json();

  return {
    success: true,
    postId: data.id,
    message: `Post created as ${body.status}. ID: ${data.id}. Integration: ${integrationId}.`,
  };
}

/**
 * Upload a TikTok slideshow (multiple images + caption) as a draft.
 */
export async function createTikTokSlideshow(
  caption: string,
  imageUrls: string[],
  integrationId?: string
): Promise<PostizResult> {
  return createPost(caption, {
    integrationId,
    mediaUrls: imageUrls,
    type: "tiktok",
  });
}

/**
 * List recent posts/drafts.
 */
export async function listPosts(): Promise<{ success: boolean; posts?: unknown[]; message: string }> {
  if (!POSTIZ_API_KEY) {
    return { success: false, message: "ERROR: POSTIZ_API_KEY not set in .env.local" };
  }

  const now = new Date();
  const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const end = now.toISOString();
  const response = await fetch(
    `${POSTIZ_API_URL}/posts?startDate=${start}&endDate=${end}`,
    { headers: { Authorization: POSTIZ_API_KEY! } },
  );

  if (!response.ok) {
    const errorText = await response.text();
    return { success: false, message: `ERROR: Postiz API returned ${response.status}: ${errorText}` };
  }

  const data = await response.json();
  const posts = Array.isArray(data) ? data : data.posts || [];

  return {
    success: true,
    posts,
    message: `Found ${posts.length} posts.`,
  };
}

// CLI entry point
// Usage:
//   npx tsx skills/postiz_post.ts "Post content here"
//   npx tsx skills/postiz_post.ts --images "url1,url2,..." "TikTok caption here"
//   npx tsx skills/postiz_post.ts --list
if (process.argv[1] && process.argv[1].includes("postiz_post")) {
  const args = process.argv.slice(2);

  if (args[0] === "--list") {
    listPosts()
      .then((result) => {
        console.log(result.message);
        if (result.posts) {
          result.posts.forEach((p: any) =>
            console.log(`  [${p.status || "?"}] ${p.id || "?"}: ${(p.content || "").substring(0, 80)}`)
          );
        }
        if (!result.success) process.exit(1);
      })
      .catch((err) => {
        console.error("Postiz error:", err);
        process.exit(1);
      });
  } else if (args[0] === "--images") {
    const imageUrls = (args[1] || "").split(",").map((u: string) => u.trim()).filter(Boolean);
    const caption = args.slice(2).join(" ");
    if (!caption || imageUrls.length === 0) {
      console.error('Usage: npx tsx skills/postiz_post.ts --images "url1,url2,..." "Caption"');
      process.exit(1);
    }
    createTikTokSlideshow(caption, imageUrls)
      .then((result) => {
        console.log(result.message);
        if (!result.success) process.exit(1);
      })
      .catch((err) => {
        console.error("Postiz error:", err);
        process.exit(1);
      });
  } else {
    const content = args.join(" ");
    if (!content) {
      console.error('Usage: npx tsx skills/postiz_post.ts "Post content here"');
      process.exit(1);
    }
    createPost(content)
      .then((result) => {
        console.log(result.message);
        if (!result.success) process.exit(1);
      })
      .catch((err) => {
        console.error("Postiz error:", err);
        process.exit(1);
      });
  }
}
