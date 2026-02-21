/**
 * Agent config encryption (AES-GCM).
 * Used client-side to encrypt config before upload.
 */

const ALGORITHM = "AES-GCM";
const KEY_LENGTH = 256;
const IV_LENGTH = 12;

export interface AgentConfig {
  version: number;
  model: string;
  confidence_threshold: number;
  max_spend: number;
  allowed_tools: string[];
  persona: string;
  created_at: number;
  human_preferences?: Record<string, unknown>;
}

export interface EncryptedOutput {
  encryptedBlobBase64: string;
  ivBase64: string;
  algorithm: string;
}

/**
 * Generate a random AES-GCM key and IV.
 * Returns raw key as Uint8Array (for sealing/storage by owner).
 */
export async function generateKeyAndIv(): Promise<{
  key: Uint8Array;
  iv: Uint8Array;
}> {
  const key = crypto.getRandomValues(new Uint8Array(KEY_LENGTH / 8));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  return { key, iv };
}

/**
 * Encrypt config JSON. Uses Web Crypto API (works in browser and Node 19+).
 */
export async function encryptConfig(
  config: AgentConfig,
  key: Uint8Array
): Promise<EncryptedOutput> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const encoded = new TextEncoder().encode(JSON.stringify(config));

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key as unknown as BufferSource,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ["encrypt"]
  );

  const encrypted = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    cryptoKey,
    encoded
  );

  return {
    encryptedBlobBase64: btoa(
      String.fromCharCode(...new Uint8Array(encrypted))
    ),
    ivBase64: btoa(String.fromCharCode(...iv)),
    algorithm: ALGORITHM,
  };
}

/**
 * Create a default agent config.
 */
export function createDefaultConfig(overrides?: Partial<AgentConfig>): AgentConfig {
  return {
    version: 1,
    model: "gpt-4",
    confidence_threshold: 0.72,
    max_spend: 1.5,
    allowed_tools: ["human_fallback"],
    persona: "autonomous execution agent",
    created_at: Math.floor(Date.now() / 1000),
    ...overrides,
  };
}
