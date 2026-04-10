import { google } from "googleapis";

function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

const SCOPES = [
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
];

export function getAuthUrl(): string {
  const client = getOAuth2Client();
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
  });
}

export async function getTokensFromCode(
  code: string
): Promise<{ accessToken: string; refreshToken: string; googleId: string; email: string }> {
  const client = getOAuth2Client();
  const { tokens } = await client.getToken(code);
  client.setCredentials(tokens);

  const oauth2 = google.oauth2({ version: "v2", auth: client });
  const { data } = await oauth2.userinfo.get();

  if (!data.id || !data.email) {
    throw new Error("Missing user info from Google");
  }

  return {
    accessToken: tokens.access_token ?? "",
    refreshToken: tokens.refresh_token ?? "",
    googleId: data.id,
    email: data.email,
  };
}

export async function refreshAccessToken(refreshToken: string): Promise<string> {
  const client = getOAuth2Client();
  client.setCredentials({ refresh_token: refreshToken });
  const { credentials } = await client.refreshAccessToken();
  return credentials.access_token ?? "";
}
