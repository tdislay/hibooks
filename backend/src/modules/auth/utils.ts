import { createHmac, randomBytes } from "crypto";

/**
 * 24 bytes / 192 bits of entropy encoded in base64 (256 bits string / 32 characters).
 *
 * base64url is used for url safety.
 */
export function secureIdGenerator(): string {
  return randomBytes(24).toString("base64url");
}

export function signHS256(content: string, secret: string): string {
  const hmac = createHmac("sha256", secret);
  const signature = hmac.update(content).digest("base64url");

  return `${content}.${signature}`;
}

export function isSignedTokenValid(
  signedToken: string,
  secret: string,
): boolean {
  const [content] = signedToken.split(".");
  const expectedSignedToken = signHS256(content, secret);

  return expectedSignedToken === signedToken;
}
