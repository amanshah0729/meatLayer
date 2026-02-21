/**
 * ABI for reading Governor: supports both Bravo-style (proposalCount, proposals)
 * and OpenZeppelin-style (proposalThreshold, proposalSnapshot, proposalDeadline, state).
 * ProposalCreated event used to get latest proposal ID when there is no proposalCount.
 */
export const GOVERNOR_ABI = [
  // Bravo-style
  {
    inputs: [],
    name: "proposalCount",
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "proposalId", type: "uint256", internalType: "uint256" }],
    name: "proposals",
    outputs: [
      { name: "id", type: "uint256", internalType: "uint256" },
      { name: "proposer", type: "address", internalType: "address" },
      { name: "eta", type: "uint256", internalType: "uint256" },
      { name: "startBlock", type: "uint256", internalType: "uint256" },
      { name: "endBlock", type: "uint256", internalType: "uint256" },
      { name: "forVotes", type: "uint256", internalType: "uint256" },
      { name: "againstVotes", type: "uint256", internalType: "uint256" },
      { name: "abstainVotes", type: "uint256", internalType: "uint256" },
      { name: "canceled", type: "bool", internalType: "bool" },
      { name: "executed", type: "bool", internalType: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
  // OpenZeppelin-style (Nouns Builder)
  {
    inputs: [],
    name: "proposalThreshold",
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "proposalId", type: "uint256", internalType: "uint256" }],
    name: "proposalSnapshot",
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "proposalId", type: "uint256", internalType: "uint256" }],
    name: "proposalDeadline",
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "proposalId", type: "uint256", internalType: "uint256" }],
    name: "state",
    outputs: [{ name: "", type: "uint8", internalType: "enum IGovernor.ProposalState" }],
    stateMutability: "view",
    type: "function",
  },
  // ProposalCreated: (uint256 proposalId, address proposer, address[] targets, uint256[] values, string[] signatures, bytes[] calldatas, uint256 voteStart, uint256 voteEnd, string description)
  {
    type: "event",
    name: "ProposalCreated",
    inputs: [
      { name: "proposalId", type: "uint256", indexed: true, internalType: "uint256" },
      { name: "proposer", type: "address", indexed: true, internalType: "address" },
      { name: "targets", type: "address[]", indexed: false, internalType: "address[]" },
      { name: "values", type: "uint256[]", indexed: false, internalType: "uint256[]" },
      { name: "signatures", type: "string[]", indexed: false, internalType: "string[]" },
      { name: "calldatas", type: "bytes[]", indexed: false, internalType: "bytes[]" },
      { name: "voteStart", type: "uint256", indexed: false, internalType: "uint256" },
      { name: "voteEnd", type: "uint256", indexed: false, internalType: "uint256" },
      { name: "description", type: "string", indexed: false, internalType: "string" },
    ],
  },
] as const;

/** Nouns Builder ProposalCreated event: decode to get description + vote counts. */
export const NOUNS_PROPOSAL_CREATED_EVENT = {
  type: "event" as const,
  name: "ProposalCreated",
  inputs: [
    { name: "proposalId", type: "bytes32", indexed: false, internalType: "bytes32" },
    { name: "targets", type: "address[]", indexed: false, internalType: "address[]" },
    { name: "values", type: "uint256[]", indexed: false, internalType: "uint256[]" },
    { name: "calldatas", type: "bytes[]", indexed: false, internalType: "bytes[]" },
    { name: "description", type: "string", indexed: false, internalType: "string" },
    { name: "descriptionHash", type: "bytes32", indexed: false, internalType: "bytes32" },
    {
      name: "proposal",
      type: "tuple",
      indexed: false,
      internalType: "struct GovernorTypesV1.Proposal",
      components: [
        { name: "proposer", type: "address", internalType: "address" },
        { name: "timeCreated", type: "uint32", internalType: "uint32" },
        { name: "againstVotes", type: "uint32", internalType: "uint32" },
        { name: "forVotes", type: "uint32", internalType: "uint32" },
        { name: "abstainVotes", type: "uint32", internalType: "uint32" },
        { name: "voteStart", type: "uint32", internalType: "uint32" },
        { name: "voteEnd", type: "uint32", internalType: "uint32" },
        { name: "proposalThreshold", type: "uint32", internalType: "uint32" },
        { name: "quorumVotes", type: "uint32", internalType: "uint32" },
        { name: "executed", type: "bool", internalType: "bool" },
        { name: "canceled", type: "bool", internalType: "bool" },
        { name: "vetoed", type: "bool", internalType: "bool" },
      ],
    },
  ],
};

/** Nouns Builder Governor uses bytes32 proposalId (proposalSnapshot/proposalDeadline take bytes32). */
export const GOVERNOR_ABI_BYTES32 = [
  {
    inputs: [{ name: "proposalId", type: "bytes32", internalType: "bytes32" }],
    name: "proposalSnapshot",
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "proposalId", type: "bytes32", internalType: "bytes32" }],
    name: "proposalDeadline",
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export type GovernorProposal = {
  id: bigint;
  proposer: string;
  eta: bigint;
  startBlock: bigint;
  endBlock: bigint;
  forVotes: bigint;
  againstVotes: bigint;
  abstainVotes: bigint;
  canceled: boolean;
  executed: boolean;
};
