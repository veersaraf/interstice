/**
 * Generate Images Skill — OpenAI gpt-image-1
 *
 * Usage from CLI: npx tsx skills/generate_images.ts "product name" "product description"
 *
 * Generates TikTok slideshow images (1024x1536 portrait) using OpenAI's
 * image generation API. Creates 6 images per slideshow with locked scene architecture.
 *
 * Required env vars in .env.local:
 *   OPENAI_API_KEY — OpenAI API key
 */

import { config } from "dotenv";
config({ path: ".env.local" });

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

interface ImageResult {
  success: boolean;
  images?: Array<{ url: string; scene: string }>;
  message: string;
}

const SCENE_ARCHITECTURE = [
  { scene: "hook", prompt: "Eye-catching hero shot of {product} that stops the scroll. Bold, vibrant, centered composition." },
  { scene: "problem", prompt: "Visual metaphor showing the problem {product} solves. Frustrated person or broken workflow. Moody lighting." },
  { scene: "solution", prompt: "Clean product shot of {product} in action. Bright, optimistic, modern workspace setting." },
  { scene: "features", prompt: "Infographic-style layout highlighting 3 key features of {product}. Clean icons, minimal text, professional." },
  { scene: "social_proof", prompt: "Happy customer using {product}. Authentic feel, natural lighting, diverse representation." },
  { scene: "cta", prompt: "Bold call-to-action slide for {product}. Arrow or pointer element. Urgency and excitement. Brand colors." },
];

/**
 * Generate a full 6-image TikTok slideshow for a product.
 */
export async function generateSlideshow(
  productName: string,
  productDescription: string
): Promise<ImageResult> {
  if (!OPENAI_API_KEY) {
    return {
      success: false,
      message: "ERROR: OPENAI_API_KEY not set in .env.local. Get one at https://platform.openai.com/api-keys",
    };
  }

  console.log(`[generate_images] Creating 6-image slideshow for: ${productName}`);

  const images: Array<{ url: string; scene: string }> = [];

  for (const scene of SCENE_ARCHITECTURE) {
    const prompt = scene.prompt
      .replace(/\{product\}/g, productName)
      + ` Product context: ${productDescription}. Style: modern, clean, TikTok-optimized vertical format.`;

    console.log(`  [${scene.scene}] Generating...`);

    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-image-1",
        prompt,
        n: 1,
        size: "1024x1536",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        images,
        message: `ERROR: OpenAI API returned ${response.status} on scene "${scene.scene}": ${errorText}`,
      };
    }

    const data = await response.json();
    const imageUrl = data.data?.[0]?.url || data.data?.[0]?.b64_json;

    if (imageUrl) {
      images.push({ url: imageUrl, scene: scene.scene });
    }
  }

  return {
    success: true,
    images,
    message: `Generated ${images.length}/6 slideshow images for "${productName}".`,
  };
}

/**
 * Generate a single image with a custom prompt.
 */
export async function generateSingleImage(prompt: string): Promise<ImageResult> {
  if (!OPENAI_API_KEY) {
    return {
      success: false,
      message: "ERROR: OPENAI_API_KEY not set in .env.local",
    };
  }

  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-image-1",
      prompt,
      n: 1,
      size: "1024x1536",
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    return {
      success: false,
      message: `ERROR: OpenAI API returned ${response.status}: ${errorText}`,
    };
  }

  const data = await response.json();
  const imageUrl = data.data?.[0]?.url || data.data?.[0]?.b64_json;

  return {
    success: true,
    images: imageUrl ? [{ url: imageUrl, scene: "custom" }] : [],
    message: imageUrl ? `Image generated successfully.` : "No image returned.",
  };
}

// CLI entry point
if (process.argv[1] && process.argv[1].includes("generate_images")) {
  const productName = process.argv[2];
  const productDescription = process.argv.slice(3).join(" ");

  if (!productName) {
    console.error('Usage: npx tsx skills/generate_images.ts "Product Name" "Product description"');
    process.exit(1);
  }

  generateSlideshow(productName, productDescription || productName)
    .then((result) => {
      console.log(result.message);
      if (result.images) {
        result.images.forEach((img) => console.log(`  [${img.scene}] ${img.url}`));
      }
      if (!result.success) process.exit(1);
    })
    .catch((err) => {
      console.error("Image generation error:", err);
      process.exit(1);
    });
}
