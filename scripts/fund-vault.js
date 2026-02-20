const { ethers } = require("ethers");

const RPC_URL = "https://testnet-rpc.monad.xyz";
const VAULT_ADDRESS = "0x3C29D937B1B9D6DaBaC8CE733595F1cBB0E0b3DF";
const PRIVATE_KEY = "9eb4fe9338e82a146e1640f117c8e0c9802be391ce6f7d57eeb7d1c02f581226";

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

  console.log("Wallet:", wallet.address);
  const balance = await provider.getBalance(wallet.address);
  console.log("Balance:", ethers.formatEther(balance), "MON");

  const vault = new ethers.Contract(
    VAULT_ADDRESS,
    ["function deposit(bytes32 taskId) external payable"],
    wallet
  );

  const dummyTaskId = "0x" + "0".repeat(63) + "1";
  const amount = ethers.parseEther("50");

  console.log("Depositing 50 MON into vault...");
  const tx = await vault.deposit(dummyTaskId, { value: amount });
  console.log("Tx sent:", tx.hash);

  const receipt = await tx.wait();
  console.log("Confirmed in block:", receipt.blockNumber);
  console.log("Vault funded with 50 MON!");
}

main().catch(console.error);
