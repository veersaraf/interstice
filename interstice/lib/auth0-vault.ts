/**
 * Auth0 Token Vault — OAuth token management for agents (PRIZE: $1,750)
 *
 * Provides a centralized vault for agents to request OAuth tokens
 * for third-party services (Gmail, LinkedIn, etc.) via Auth0's Token Vault.
 *
 * Required env vars in .env.local:
 *   AUTH0_DOMAIN        — Auth0 tenant domain (e.g., myapp.us.auth0.com)
 *   AUTH0_CLIENT_ID     — Auth0 application client ID
 *   AUTH0_CLIENT_SECRET — Auth0 application client secret
 *   AUTH0_AUDIENCE      — Auth0 API audience identifier
 */

import { config } from "dotenv";
config({ path: ".env.local" });

const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN;
const AUTH0_CLIENT_ID = process.env.AUTH0_CLIENT_ID;
const AUTH0_CLIENT_SECRET = process.env.AUTH0_CLIENT_SECRET;
const AUTH0_AUDIENCE = process.env.AUTH0_AUDIENCE;

interface TokenResult {
  success: boolean;
  accessToken?: string;
  tokenType?: string;
  expiresIn?: number;
  message: string;
}

function checkEnvVars(): string | null {
  if (!AUTH0_DOMAIN) return "AUTH0_DOMAIN";
  if (!AUTH0_CLIENT_ID) return "AUTH0_CLIENT_ID";
  if (!AUTH0_CLIENT_SECRET) return "AUTH0_CLIENT_SECRET";
  return null;
}

/**
 * Get a machine-to-machine access token from Auth0.
 * Used by agents to authenticate with protected APIs.
 */
export async function getM2MToken(audience?: string): Promise<TokenResult> {
  const missing = checkEnvVars();
  if (missing) {
    return {
      success: false,
      message: `ERROR: ${missing} not set in .env.local. Configure Auth0 at https://manage.auth0.com`,
    };
  }

  const response = await fetch(`https://${AUTH0_DOMAIN}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: AUTH0_CLIENT_ID,
      client_secret: AUTH0_CLIENT_SECRET,
      audience: audience || AUTH0_AUDIENCE,
      grant_type: "client_credentials",
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    return {
      success: false,
      message: `ERROR: Auth0 returned ${response.status}: ${errorText}`,
    };
  }

  const data = await response.json();

  return {
    success: true,
    accessToken: data.access_token,
    tokenType: data.token_type,
    expiresIn: data.expires_in,
    message: `Token obtained. Type: ${data.token_type}. Expires in: ${data.expires_in}s.`,
  };
}

/**
 * Exchange a user's refresh token for a fresh access token.
 * Used when agents act on behalf of a user (e.g., sending from their Gmail).
 */
export async function refreshUserToken(refreshToken: string): Promise<TokenResult> {
  const missing = checkEnvVars();
  if (missing) {
    return {
      success: false,
      message: `ERROR: ${missing} not set in .env.local`,
    };
  }

  const response = await fetch(`https://${AUTH0_DOMAIN}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: AUTH0_CLIENT_ID,
      client_secret: AUTH0_CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    return {
      success: false,
      message: `ERROR: Auth0 refresh failed (${response.status}): ${errorText}`,
    };
  }

  const data = await response.json();

  return {
    success: true,
    accessToken: data.access_token,
    tokenType: data.token_type,
    expiresIn: data.expires_in,
    message: `Token refreshed. Expires in: ${data.expires_in}s.`,
  };
}

/**
 * Get user info from an access token.
 */
export async function getUserInfo(accessToken: string): Promise<{ success: boolean; user?: Record<string, unknown>; message: string }> {
  if (!AUTH0_DOMAIN) {
    return { success: false, message: "ERROR: AUTH0_DOMAIN not set in .env.local" };
  }

  const response = await fetch(`https://${AUTH0_DOMAIN}/userinfo`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const errorText = await response.text();
    return { success: false, message: `ERROR: Auth0 userinfo failed (${response.status}): ${errorText}` };
  }

  const user = await response.json();
  return { success: true, user, message: `User: ${user.email || user.sub}` };
}
