/**
 * Client-side: build the message to sign for iNFT human-task auth.
 * Message format: meatlayer:human-task:{token_id}:{timestamp}
 * Use personal_sign (eth_sign) with the connected wallet.
 */
export function buildHumanTaskAuthMessage(tokenId: number | string): string {
  const timestamp = Math.floor(Date.now() / 1000);
  return `meatlayer:human-task:${tokenId}:${timestamp}`;
}
