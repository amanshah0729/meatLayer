import { ethers } from "ethers";

const VAULT_ABI = [
  "function deposit(bytes32 taskId) external payable",
  "function withdraw(address payable worker, uint256 amount) external",
  "function refund(bytes32 taskId) external",
  "function getDeposit(bytes32 taskId) external view returns (address depositor, uint256 amount, bool refunded)",
  "function vaultBalance() external view returns (uint256)",
  "event Deposited(bytes32 indexed taskId, address indexed depositor, uint256 amount)",
  "event Withdrawn(address indexed worker, uint256 amount)",
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
  const address = process.env.VAULT_CONTRACT_ADDRESS;
  if (!address) throw new Error("VAULT_CONTRACT_ADDRESS not set");
  return new ethers.Contract(address, VAULT_ABI, signerOrProvider || getSigner());
}

/**
 * Convert a task ID (number) to bytes32 for the contract.
 */
export function taskIdToBytes32(taskId: number | string): string {
  const hex = BigInt(taskId).toString(16).padStart(64, "0");
  return "0x" + hex;
}

/**
 * Deposit funds into the vault for a task.
 */
export async function depositToVault(
  taskId: number | string,
  amountWei: string
): Promise<string> {
  const contract = getContract();
  const tid = taskIdToBytes32(taskId);
  const tx = await contract.deposit(tid, { value: amountWei });
  const receipt = await tx.wait();
  return receipt.hash;
}

/**
 * Withdraw funds from the vault to pay a worker.
 */
export async function withdrawFromVault(
  workerAddress: string,
  amountWei: string
): Promise<string> {
  const contract = getContract();
  const tx = await contract.withdraw(workerAddress, amountWei);
  const receipt = await tx.wait();
  return receipt.hash;
}

/**
 * Refund a task deposit back to the original depositor.
 */
export async function refundFromVault(taskId: number | string): Promise<string> {
  const contract = getContract();
  const tid = taskIdToBytes32(taskId);
  const tx = await contract.refund(tid);
  const receipt = await tx.wait();
  return receipt.hash;
}

/**
 * Get the total balance held by the vault.
 */
export async function getVaultBalance(): Promise<string> {
  const contract = getContract(getProvider());
  const balance = await contract.vaultBalance();
  return balance.toString();
}
