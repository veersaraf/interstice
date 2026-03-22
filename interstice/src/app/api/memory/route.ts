import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const MEMORY_PATH = path.resolve(process.cwd(), "memory", "company.md");

export async function GET() {
  try {
    const content = fs.readFileSync(MEMORY_PATH, "utf-8");
    return NextResponse.json({ content });
  } catch {
    return NextResponse.json({ content: "" });
  }
}
