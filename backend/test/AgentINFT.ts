import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { network } from "hardhat";
import { keccak256, toHex, getAddress } from "viem";

describe("AgentINFT", async function () {
  const { viem } = await network.connect();

  it("Should deploy and set owner", async function () {
    const [deployer] = await viem.getWalletClients();
    const agentINFT = await viem.deployContract("AgentINFT");
    const owner = await agentINFT.read.owner();
    assert.equal(getAddress(owner), getAddress(deployer.account.address));
  });

  it("Should mint agent with storage pointer and blob hash", async function () {
    const [deployer, recipient] = await viem.getWalletClients();
    const agentINFT = await viem.deployContract("AgentINFT");

    const storagePointer = "QmTest123";
    const blobHash = keccak256(toHex("encrypted-blob-data"));

    await agentINFT.write.mintAgent([
      recipient.account.address,
      storagePointer,
      blobHash,
    ]);

    const tokenId = 1n;

    const owner = await agentINFT.read.ownerOf([1n]);
    assert.equal(getAddress(owner), getAddress(recipient.account.address));

    const [sp, bh] = await agentINFT.read.agentData([1n]);
    assert.equal(sp, storagePointer);
    assert.equal(bh, blobHash);
  });

  it("Should emit AgentMinted event", async function () {
    const [deployer, recipient] = await viem.getWalletClients();
    const agentINFT = await viem.deployContract("AgentINFT");
    const storagePointer = "QmEventTest";
    const blobHash = keccak256(toHex("data"));

    await viem.assertions.emitWithArgs(
      agentINFT.write.mintAgent([
        recipient.account.address,
        storagePointer,
        blobHash,
      ]),
      agentINFT,
      "AgentMinted",
      [1n, getAddress(recipient.account.address), storagePointer],
    );
  });

  it("Should reject mint from non-owner", async function () {
    const [deployer, nonOwner, recipient] = await viem.getWalletClients();
    const agentINFT = await viem.deployContract("AgentINFT");
    const storagePointer = "QmReject";
    const blobHash = keccak256(toHex("data"));

    await assert.rejects(async () => {
      await agentINFT.write.mintAgent(
        [recipient.account.address, storagePointer, blobHash],
        { account: nonOwner.account },
      );
    });
  });

  it("Should allow transfer (ERC721)", async function () {
    const [deployer, owner, newOwner] = await viem.getWalletClients();
    const agentINFT = await viem.deployContract("AgentINFT");
    const blobHash = keccak256(toHex("blob"));

    await agentINFT.write.mintAgent([owner.account.address, "Qm1", blobHash]);

    await agentINFT.write.transferFrom(
      [owner.account.address, newOwner.account.address, 1n],
      { account: owner.account },
    );

    const currentOwner = await agentINFT.read.ownerOf([1n]);
    assert.equal(getAddress(currentOwner), getAddress(newOwner.account.address));
  });
});
