import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("HumanTaskVaultModule", (m) => {
  const vault = m.contract("HumanTaskVault");

  return { vault };
});
