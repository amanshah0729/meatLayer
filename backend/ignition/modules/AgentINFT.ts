import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("AgentINFTModule", (m) => {
  const agentINFT = m.contract("AgentINFT");

  return { agentINFT };
});
