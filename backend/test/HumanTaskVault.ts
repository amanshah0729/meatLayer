import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { network } from "hardhat";
import { parseEther, keccak256, toHex, getAddress } from "viem";

function taskId(name: string): `0x${string}` {
  return keccak256(toHex(name));
}

describe("HumanTaskVault", async function () {
  const { viem } = await network.connect();
  const publicClient = await viem.getPublicClient();

  // --- Deployment ---

  it("Should deploy and set the owner", async function () {
    const [deployer] = await viem.getWalletClients();
    const vault = await viem.deployContract("HumanTaskVault");
    const owner = await vault.read.owner();
    assert.equal(getAddress(owner), getAddress(deployer.account.address));
  });

  // --- deposit ---

  it("Should accept a deposit for a task", async function () {
    const [deployer] = await viem.getWalletClients();
    const vault = await viem.deployContract("HumanTaskVault");
    const tid = taskId("task-1");
    const amount = parseEther("1.0");

    await vault.write.deposit([tid], { value: amount });

    const result = await vault.read.getDeposit([tid]);
    assert.equal(getAddress(result[0]), getAddress(deployer.account.address));
    assert.equal(result[1], amount);
    assert.equal(result[2], false);
  });

  it("Should emit Deposited event", async function () {
    const [deployer] = await viem.getWalletClients();
    const vault = await viem.deployContract("HumanTaskVault");
    const tid = taskId("task-emit");
    const amount = parseEther("0.5");

    await viem.assertions.emitWithArgs(
      vault.write.deposit([tid], { value: amount }),
      vault,
      "Deposited",
      [tid, getAddress(deployer.account.address), amount],
    );
  });

  it("Should reject deposit with zero value", async function () {
    const vault = await viem.deployContract("HumanTaskVault");
    const tid = taskId("task-zero");

    await assert.rejects(async () => {
      await vault.write.deposit([tid], { value: 0n });
    });
  });

  it("Should reject duplicate deposit for same task", async function () {
    const vault = await viem.deployContract("HumanTaskVault");
    const tid = taskId("task-dup");
    const amount = parseEther("1.0");

    await vault.write.deposit([tid], { value: amount });

    await assert.rejects(async () => {
      await vault.write.deposit([tid], { value: amount });
    });
  });

  it("Should track vault balance correctly", async function () {
    const vault = await viem.deployContract("HumanTaskVault");

    await vault.write.deposit([taskId("t1")], { value: parseEther("1.0") });
    await vault.write.deposit([taskId("t2")], { value: parseEther("2.0") });

    const balance = await vault.read.vaultBalance();
    assert.equal(balance, parseEther("3.0"));
  });

  // --- withdraw ---

  it("Should withdraw to a worker", async function () {
    const walletClients = await viem.getWalletClients();
    const worker = walletClients[1];
    const vault = await viem.deployContract("HumanTaskVault");

    await vault.write.deposit([taskId("task-w1")], { value: parseEther("2.0") });

    const balanceBefore = await publicClient.getBalance({
      address: worker.account.address,
    });

    await vault.write.withdraw([worker.account.address, parseEther("0.5")]);

    const balanceAfter = await publicClient.getBalance({
      address: worker.account.address,
    });

    assert.equal(balanceAfter - balanceBefore, parseEther("0.5"));
  });

  it("Should emit Withdrawn event", async function () {
    const walletClients = await viem.getWalletClients();
    const worker = walletClients[1];
    const vault = await viem.deployContract("HumanTaskVault");
    const amount = parseEther("0.3");

    await vault.write.deposit([taskId("task-w-event")], { value: parseEther("1.0") });

    await viem.assertions.emitWithArgs(
      vault.write.withdraw([worker.account.address, amount]),
      vault,
      "Withdrawn",
      [getAddress(worker.account.address), amount],
    );
  });

  it("Should allow multiple withdrawals from the vault", async function () {
    const walletClients = await viem.getWalletClients();
    const worker1 = walletClients[1];
    const worker2 = walletClients[2];
    const vault = await viem.deployContract("HumanTaskVault");

    await vault.write.deposit([taskId("task-multi")], { value: parseEther("3.0") });

    await vault.write.withdraw([worker1.account.address, parseEther("1.0")]);
    await vault.write.withdraw([worker2.account.address, parseEther("1.5")]);

    const remaining = await vault.read.vaultBalance();
    assert.equal(remaining, parseEther("0.5"));
  });

  it("Should reject withdraw exceeding vault balance", async function () {
    const walletClients = await viem.getWalletClients();
    const worker = walletClients[1];
    const vault = await viem.deployContract("HumanTaskVault");

    await vault.write.deposit([taskId("task-exceed")], { value: parseEther("1.0") });

    await assert.rejects(async () => {
      await vault.write.withdraw([worker.account.address, parseEther("5.0")]);
    });
  });

  it("Should reject withdraw from non-owner", async function () {
    const walletClients = await viem.getWalletClients();
    const nonOwner = walletClients[1];
    const worker = walletClients[2];
    const vault = await viem.deployContract("HumanTaskVault");

    await vault.write.deposit([taskId("task-noauth")], { value: parseEther("1.0") });

    await assert.rejects(async () => {
      await vault.write.withdraw(
        [worker.account.address, parseEther("0.5")],
        { account: nonOwner.account },
      );
    });
  });

  // --- refund ---

  it("Should refund the depositor", async function () {
    const walletClients = await viem.getWalletClients();
    const deployer = walletClients[0];
    const vault = await viem.deployContract("HumanTaskVault");
    const tid = taskId("task-refund");
    const amount = parseEther("1.5");

    await vault.write.deposit([tid], { value: amount });

    const balanceBefore = await publicClient.getBalance({
      address: deployer.account.address,
    });

    await vault.write.refund([tid]);

    const balanceAfter = await publicClient.getBalance({
      address: deployer.account.address,
    });

    assert.ok(balanceAfter > balanceBefore);

    const result = await vault.read.getDeposit([tid]);
    assert.equal(result[2], true);
  });

  it("Should emit Refunded event", async function () {
    const [deployer] = await viem.getWalletClients();
    const vault = await viem.deployContract("HumanTaskVault");
    const tid = taskId("task-refund-event");
    const amount = parseEther("1.0");

    await vault.write.deposit([tid], { value: amount });

    await viem.assertions.emitWithArgs(
      vault.write.refund([tid]),
      vault,
      "Refunded",
      [tid, getAddress(deployer.account.address), amount],
    );
  });

  it("Should reject double refund", async function () {
    const vault = await viem.deployContract("HumanTaskVault");
    const tid = taskId("task-double-refund");

    await vault.write.deposit([tid], { value: parseEther("1.0") });
    await vault.write.refund([tid]);

    await assert.rejects(async () => {
      await vault.write.refund([tid]);
    });
  });

  it("Should reject refund from non-owner", async function () {
    const walletClients = await viem.getWalletClients();
    const nonOwner = walletClients[1];
    const vault = await viem.deployContract("HumanTaskVault");
    const tid = taskId("task-refund-noauth");

    await vault.write.deposit([tid], { value: parseEther("1.0") });

    await assert.rejects(async () => {
      await vault.write.refund([tid], { account: nonOwner.account });
    });
  });

  it("Should reject refund for nonexistent deposit", async function () {
    const vault = await viem.deployContract("HumanTaskVault");

    await assert.rejects(async () => {
      await vault.write.refund([taskId("nonexistent")]);
    });
  });
});
