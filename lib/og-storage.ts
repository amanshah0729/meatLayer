/**
 * 0G Storage upload. Server-side only (requires signer).
 * Uses dynamic import to avoid 0G SDK blocking dev server compilation.
 */

const OG_RPC_URL =
  process.env.NEXT_PUBLIC_OG_RPC_URL || "https://evmrpc-testnet.0g.ai";
const OG_INDEXER_URL =
  process.env.OG_INDEXER_URL || "https://indexer-storage-testnet-turbo.0g.ai";

/**
 * Upload encrypted blob to 0G Storage.
 * Returns the root hash (storage pointer) for use in the iNFT contract.
 */
export async function uploadTo0G(
  encryptedBlobBase64: string,
  privateKey: string
): Promise<{ rootHash: string; txHash: string }> {
  const [{ Indexer, MemData }, { ethers }] = await Promise.all([
    import("@0glabs/0g-ts-sdk"),
    import("ethers"),
  ]);

  const buffer = Buffer.from(encryptedBlobBase64, "base64");
  const data = new Uint8Array(buffer);

  const memData = new MemData(data);
  const indexer = new Indexer(OG_INDEXER_URL);
  const provider = new ethers.JsonRpcProvider(OG_RPC_URL);
  const signer = new ethers.Wallet(privateKey.trim(), provider);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [result, err] = await indexer.upload(memData, OG_RPC_URL, signer as any);
  if (err) {
    throw new Error(`0G Storage upload failed: ${err.message}`);
  }
  if (!result) {
    throw new Error("0G Storage upload returned no result");
  }

  return { rootHash: result.rootHash, txHash: result.txHash };
}
