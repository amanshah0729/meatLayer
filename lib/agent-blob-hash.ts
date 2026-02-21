/**
 * Server-side: compute keccak256 hash of encrypted blob for on-chain verification.
 */
import { keccak256, toHex } from "viem";

export function computeBlobHash(encryptedBlobBase64: string): `0x${string}` {
  const binary = Buffer.from(encryptedBlobBase64, "base64");
  return keccak256(toHex(binary));
}
