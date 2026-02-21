import { ethers } from "ethers";

const AGENT_INFT_ABI = [
  "function mintAgent(address to, string storagePointer, bytes32 blobHash) external returns (uint256 tokenId)",
  "function getStoragePointer(uint256 tokenId) external view returns (string memory)",
  "function getBlobHash(uint256 tokenId) external view returns (bytes32)",
  "function ownerOf(uint256 tokenId) external view returns (address)",
  "function agentData(uint256 tokenId) external view returns (string storagePointer, bytes32 blobHash)",
  "event AgentMinted(uint256 indexed tokenId, address indexed to, string storagePointer)",
];

function getProvider() {
  const rpcUrl = process.env.MONAD_RPC_URL || "https://testnet-rpc.monad.xyz";
  return new ethers.JsonRpcProvider(rpcUrl);
}

function getSigner() {
  const provider = getProvider();
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY?.trim();
  if (!privateKey) throw new Error("DEPLOYER_PRIVATE_KEY not set");
  return new ethers.Wallet(privateKey, provider);
}

function getAgentINFTContract(signerOrProvider?: ethers.Signer | ethers.Provider) {
  const address = process.env.AGENT_INFT_CONTRACT_ADDRESS;
  if (!address) throw new Error("AGENT_INFT_CONTRACT_ADDRESS not set");
  return new ethers.Contract(
    address,
    AGENT_INFT_ABI,
    signerOrProvider || getSigner()
  );
}

/**
 * Mint a new agent iNFT.
 */
export async function mintAgentINFT(
  to: string,
  storagePointer: string,
  blobHash: string
): Promise<{ tokenId: bigint; hash: string }> {
  const contract = getAgentINFTContract();
  const tokenId = await contract.mintAgent.staticCall(to, storagePointer, blobHash);
  const tx = await contract.mintAgent(to, storagePointer, blobHash);
  const receipt = await tx.wait();
  return { tokenId, hash: receipt!.hash };
}

/**
 * Get storage pointer for a token.
 */
export async function getStoragePointer(tokenId: bigint | number): Promise<string> {
  const contract = getAgentINFTContract(getProvider());
  return contract.getStoragePointer(tokenId);
}

/**
 * Get blob hash for a token.
 */
export async function getBlobHash(tokenId: bigint | number): Promise<string> {
  const contract = getAgentINFTContract(getProvider());
  const hash = await contract.getBlobHash(tokenId);
  return hash;
}
