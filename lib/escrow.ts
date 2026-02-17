import { ethers } from "ethers";

const ESCROW_ABI = [
  "function createEscrow(bytes32 taskId) external payable",
  "function releasePayment(bytes32 taskId, address[] calldata workers, uint256[] calldata amounts) external",
  "function refund(bytes32 taskId) external",
  "function getEscrow(bytes32 taskId) external view returns (address depositor, uint256 amount, bool released, bool refunded)",
  "event EscrowCreated(bytes32 indexed taskId, address indexed depositor, uint256 amount)",
  "event PaymentReleased(bytes32 indexed taskId, address[] workers, uint256[] amounts)",
  "event Refunded(bytes32 indexed taskId, address indexed depositor, uint256 amount)",
];

function getProvider() {
  const rpcUrl = process.env.MONAD_RPC_URL || "https://testnet.monad.xyz";
  return new ethers.JsonRpcProvider(rpcUrl);
}

function getSigner() {
  const provider = getProvider();
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
  if (!privateKey) throw new Error("DEPLOYER_PRIVATE_KEY not set");
  return new ethers.Wallet(privateKey, provider);
}

function getContract(signerOrProvider?: ethers.Signer | ethers.Provider) {
  const address = process.env.ESCROW_CONTRACT_ADDRESS;
  if (!address) throw new Error("ESCROW_CONTRACT_ADDRESS not set");
  return new ethers.Contract(
    address,
    ESCROW_ABI,
    signerOrProvider || getSigner()
  );
}

/**
 * Convert a UUID string to bytes32 for the contract.
 */
export function uuidToBytes32(uuid: string): string {
  const hex = uuid.replace(/-/g, "");
  return "0x" + hex.padEnd(64, "0");
}

/**
 * Create an escrow for a task on-chain.
 */
export async function createEscrow(
  taskId: string,
  amountWei: string
): Promise<string> {
  const contract = getContract();
  const taskIdBytes = uuidToBytes32(taskId);

  const tx = await contract.createEscrow(taskIdBytes, {
    value: amountWei,
  });
  const receipt = await tx.wait();
  return receipt.hash;
}

/**
 * Release payment to workers after consensus.
 */
export async function releasePayment(
  taskId: string,
  workers: string[],
  amounts: string[]
): Promise<string> {
  const contract = getContract();
  const taskIdBytes = uuidToBytes32(taskId);

  const tx = await contract.releasePayment(taskIdBytes, workers, amounts);
  const receipt = await tx.wait();
  return receipt.hash;
}

/**
 * Refund escrowed funds for a cancelled/expired task.
 */
export async function refundEscrow(taskId: string): Promise<string> {
  const contract = getContract();
  const taskIdBytes = uuidToBytes32(taskId);

  const tx = await contract.refund(taskIdBytes);
  const receipt = await tx.wait();
  return receipt.hash;
}

/**
 * Get escrow details for a task.
 */
export async function getEscrowDetails(taskId: string) {
  const contract = getContract(getProvider());
  const taskIdBytes = uuidToBytes32(taskId);

  const [depositor, amount, released, refunded] =
    await contract.getEscrow(taskIdBytes);
  return {
    depositor,
    amount: amount.toString(),
    released,
    refunded,
  };
}
