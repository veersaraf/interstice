/**
 * Send Email Skill — Resend API (primary) or SMTP via Nodemailer (fallback)
 *
 * Usage from CLI: npx tsx skills/send_email.ts "to@example.com" "Subject" "Email body here"
 *
 * Primary: Resend API (just one env var)
 *   RESEND_API_KEY  — from resend.com/api-keys
 *
 * Fallback: SMTP via Nodemailer (if SMTP_HOST is set)
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
 *
 * For testing without any provider: leave all vars unset → log mode
 */

import { config } from "dotenv";
config({ path: ".env.local" });

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587", 10);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM || SMTP_USER || "Interstice CEO <ceo@melonmedia.site>";

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
  // Resend API — primary path
  if (RESEND_API_KEY) {
    return sendViaResend(to, subject, body);
  }

  // SMTP — fallback path
  if (SMTP_HOST && SMTP_HOST !== "log") {
    return sendViaSMTP(to, subject, body);
  }

  // Log-only mode
  console.log(`[send_email] LOG MODE — would send:`);
  console.log(`  To: ${to}`);
  console.log(`  Subject: ${subject}`);
  console.log(`  Body: ${body.substring(0, 200)}...`);
  return {
    success: true,
    messageId: `log-${Date.now()}`,
    message: `[LOG MODE] Email logged (no email provider configured). To: ${to}, Subject: ${subject}`,
  };
}

async function sendViaResend(
  to: string,
  subject: string,
  body: string
): Promise<EmailResult> {
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: SMTP_FROM,
        to: [to],
        subject,
        text: body,
        html: body.replace(/\n/g, "<br>"),
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      return {
        success: false,
        message: `Resend API error (${res.status}): ${errBody}`,
      };
    }

    const data = await res.json();
    return {
      success: true,
      messageId: data.id,
      message: `Email sent via Resend. ID: ${data.id}. To: ${to}, Subject: ${subject}`,
    };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message: `Resend send failed: ${errMsg}`,
    };
  }
}

async function sendViaSMTP(
  to: string,
  subject: string,
  body: string
): Promise<EmailResult> {
  if (!SMTP_USER || !SMTP_PASS) {
    return {
      success: false,
      message: "ERROR: SMTP_USER and SMTP_PASS must be set in .env.local",
    };
  }

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
      message: `Email sent via SMTP. Message ID: ${info.messageId}. To: ${to}, Subject: ${subject}`,
    };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message: `SMTP send failed: ${errMsg}`,
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
