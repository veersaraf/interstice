/**
 * Send Email Skill — SMTP via Nodemailer
 *
 * Usage from CLI: npx tsx skills/send_email.ts "to@example.com" "Subject" "Email body here"
 *
 * The Comms Agent's approved emails are sent via this skill.
 *
 * Required env vars in .env.local:
 *   SMTP_HOST     — SMTP server host (e.g., smtp.gmail.com)
 *   SMTP_PORT     — SMTP port (e.g., 587)
 *   SMTP_USER     — SMTP username / from address
 *   SMTP_PASS     — SMTP password or app password
 *   SMTP_FROM     — Display name + address, e.g., "Interstice CEO <veer@interstice.ai>"
 *
 * For Gmail: use an App Password (not your login password).
 * For testing without SMTP: set SMTP_HOST=log to just print the email.
 */

import { config } from "dotenv";
config({ path: ".env.local" });

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587", 10);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM || SMTP_USER;

interface EmailResult {
  success: boolean;
  messageId?: string;
  message: string;
}

export async function sendEmail(
  to: string,
  subject: string,
  body: string
): Promise<EmailResult> {
  // Log-only mode for testing
  if (!SMTP_HOST || SMTP_HOST === "log") {
    console.log(`[send_email] LOG MODE — would send:`);
    console.log(`  To: ${to}`);
    console.log(`  Subject: ${subject}`);
    console.log(`  Body: ${body.substring(0, 200)}...`);
    return {
      success: true,
      messageId: `log-${Date.now()}`,
      message: `[LOG MODE] Email logged (no SMTP configured). To: ${to}, Subject: ${subject}`,
    };
  }

  if (!SMTP_USER || !SMTP_PASS) {
    return {
      success: false,
      message: "ERROR: SMTP_USER and SMTP_PASS must be set in .env.local",
    };
  }

  // Dynamic import so the skill works even without nodemailer installed
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let nodemailer: any;
  try {
    const mod = "nodemailer";
    nodemailer = await import(/* webpackIgnore: true */ mod);
  } catch {
    return {
      success: false,
      message: "ERROR: nodemailer not installed. Run: npm install nodemailer",
    };
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: SMTP_FROM,
      to,
      subject,
      text: body,
      html: body.replace(/\n/g, "<br>"),
    });

    return {
      success: true,
      messageId: info.messageId,
      message: `Email sent successfully. Message ID: ${info.messageId}. To: ${to}, Subject: ${subject}`,
    };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message: `ERROR: Failed to send email: ${errMsg}`,
    };
  }
}

// CLI entry point
if (process.argv[1] && process.argv[1].includes("send_email")) {
  const to = process.argv[2];
  const subject = process.argv[3];
  const body = process.argv.slice(4).join(" ");

  if (!to || !subject || !body) {
    console.error('Usage: npx tsx skills/send_email.ts "to@email.com" "Subject" "Body"');
    process.exit(1);
  }

  sendEmail(to, subject, body)
    .then((result) => {
      console.log(result.message);
      if (!result.success) process.exit(1);
    })
    .catch((err) => {
      console.error("Email error:", err);
      process.exit(1);
    });
}
