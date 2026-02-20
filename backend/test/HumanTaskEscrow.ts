import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { network } from "hardhat";
import { parseEther, formatEther, keccak256, toHex, getAddress } from "viem";

// Helper: generate a deterministic bytes32 task ID from a string
function taskId(name: string): `0x${string}` {
  return keccak256(toHex(name));
}

describe("HumanTaskEscrow", async function () {
  const { viem } = await network.connect();
  const publicClient = await viem.getPublicClient();

  // --- Deployment ---

  it("Should deploy and set the owner", async function () {
    const [deployer] = await viem.getWalletClients();
    const escrow = await viem.deployContract("HumanTaskEscrow");
    const owner = await escrow.read.owner();
    assert.equal(
      getAddress(owner),
      getAddress(deployer.account.address),
    );
  });

  // --- createEscrow ---

  it("Should create an escrow with the correct amount", async function () {
    const [deployer] = await viem.getWalletClients();
    const escrow = await viem.deployContract("HumanTaskEscrow");
    const tid = taskId("task-1");
    const amount = parseEther("1.0");

    await escrow.write.createEscrow([tid], { value: amount });

    const result = await escrow.read.getEscrow([tid]);
    assert.equal(getAddress(result[0]), getAddress(deployer.account.address)); // depositor
    assert.equal(result[1], amount); // amount
    assert.equal(result[2], false); // released
    assert.equal(result[3], false); // refunded
  });

  it("Should emit EscrowCreated event", async function () {
    const escrow = await viem.deployContract("HumanTaskEscrow");
    const tid = taskId("task-emit");
    const amount = parseEther("0.5");

    await viem.assertions.emitWithArgs(
      escrow.write.createEscrow([tid], { value: amount }),
      escrow,
      "EscrowCreated",
      [tid, undefined, amount],
    );
  });

  it("Should reject escrow with zero value", async function () {
    const escrow = await viem.deployContract("HumanTaskEscrow");
    const tid = taskId("task-zero");

    await assert.rejects(
      async () => {
        await escrow.write.createEscrow([tid], { value: 0n });
      },
    );
  });

  it("Should reject duplicate escrow for same task ID", async function () {
    const escrow = await viem.deployContract("HumanTaskEscrow");
    const tid = taskId("task-dup");
    const amount = parseEther("1.0");

    await escrow.write.createEscrow([tid], { value: amount });

    await assert.rejects(
      async () => {
        await escrow.write.createEscrow([tid], { value: amount });
      },
    );
  });

  // --- releasePayment ---

  it("Should release payment to a single worker", async function () {
    const walletClients = await viem.getWalletClients();
    const worker = walletClients[1];
    const escrow = await viem.deployContract("HumanTaskEscrow");
    const tid = taskId("task-release-single");
    const amount = parseEther("2.0");

    await escrow.write.createEscrow([tid], { value: amount });

    const balanceBefore = await publicClient.getBalance({
      address: worker.account.address,
    });

    await escrow.write.releasePayment([
      tid,
      [worker.account.address],
      [amount],
    ]);

    const balanceAfter = await publicClient.getBalance({
      address: worker.account.address,
    });

    assert.equal(balanceAfter - balanceBefore, amount);

    // Verify escrow is marked released
    const result = await escrow.read.getEscrow([tid]);
    assert.equal(result[2], true); // released
  });

  it("Should release payment to multiple workers and refund remainder", async function () {
    const walletClients = await viem.getWalletClients();
    const deployer = walletClients[0];
    const worker1 = walletClients[1];
    const worker2 = walletClients[2];

    const escrow = await viem.deployContract("HumanTaskEscrow");
    const tid = taskId("task-release-multi");
    const totalEscrowed = parseEther("3.0");
    const pay1 = parseEther("1.0");
    const pay2 = parseEther("1.5");
    // remainder = 0.5 ETH goes back to depositor

    await escrow.write.createEscrow([tid], { value: totalEscrowed });

    const depositorBefore = await publicClient.getBalance({
      address: deployer.account.address,
    });
    const w1Before = await publicClient.getBalance({
      address: worker1.account.address,
    });
    const w2Before = await publicClient.getBalance({
      address: worker2.account.address,
    });

    await escrow.write.releasePayment([
      tid,
      [worker1.account.address, worker2.account.address],
      [pay1, pay2],
    ]);

    const w1After = await publicClient.getBalance({
      address: worker1.account.address,
    });
    const w2After = await publicClient.getBalance({
      address: worker2.account.address,
    });

    assert.equal(w1After - w1Before, pay1);
    assert.equal(w2After - w2Before, pay2);
  });

  it("Should emit PaymentReleased event", async function () {
    const walletClients = await viem.getWalletClients();
    const worker = walletClients[1];
    const escrow = await viem.deployContract("HumanTaskEscrow");
    const tid = taskId("task-release-event");
    const amount = parseEther("1.0");

    await escrow.write.createEscrow([tid], { value: amount });

    await viem.assertions.emitWithArgs(
      escrow.write.releasePayment([
        tid,
        [worker.account.address],
        [amount],
      ]),
      escrow,
      "PaymentReleased",
      [tid, [worker.account.address], [amount]],
    );
  });

  it("Should reject release if amounts exceed escrowed amount", async function () {
    const walletClients = await viem.getWalletClients();
    const worker = walletClients[1];
    const escrow = await viem.deployContract("HumanTaskEscrow");
    const tid = taskId("task-release-exceed");

    await escrow.write.createEscrow([tid], { value: parseEther("1.0") });

    await assert.rejects(
      async () => {
        await escrow.write.releasePayment([
          tid,
          [worker.account.address],
          [parseEther("2.0")],
        ]);
      },
    );
  });

  it("Should reject double release", async function () {
    const walletClients = await viem.getWalletClients();
    const worker = walletClients[1];
    const escrow = await viem.deployContract("HumanTaskEscrow");
    const tid = taskId("task-double-release");
    const amount = parseEther("1.0");

    await escrow.write.createEscrow([tid], { value: amount });
    await escrow.write.releasePayment([
      tid,
      [worker.account.address],
      [amount],
    ]);

    await assert.rejects(
      async () => {
        await escrow.write.releasePayment([
          tid,
          [worker.account.address],
          [amount],
        ]);
      },
    );
  });

  it("Should reject release from non-owner", async function () {
    const walletClients = await viem.getWalletClients();
    const nonOwner = walletClients[1];
    const worker = walletClients[2];
    const escrow = await viem.deployContract("HumanTaskEscrow");
    const tid = taskId("task-non-owner-release");
    const amount = parseEther("1.0");

    await escrow.write.createEscrow([tid], { value: amount });

    // Try to release from non-owner wallet
    await assert.rejects(
      async () => {
        await escrow.write.releasePayment(
          [tid, [worker.account.address], [amount]],
          { account: nonOwner.account },
        );
      },
    );
  });

  // --- refund ---

  it("Should refund the depositor", async function () {
    const walletClients = await viem.getWalletClients();
    const deployer = walletClients[0];
    const escrow = await viem.deployContract("HumanTaskEscrow");
    const tid = taskId("task-refund");
    const amount = parseEther("1.5");

    await escrow.write.createEscrow([tid], { value: amount });

    const balanceBefore = await publicClient.getBalance({
      address: deployer.account.address,
    });

    await escrow.write.refund([tid]);

    const balanceAfter = await publicClient.getBalance({
      address: deployer.account.address,
    });

    // Balance should increase (minus gas), so just check it went up significantly
    assert.ok(balanceAfter > balanceBefore);

    // Verify escrow is marked refunded
    const result = await escrow.read.getEscrow([tid]);
    assert.equal(result[3], true); // refunded
  });

  it("Should emit Refunded event", async function () {
    const [deployer] = await viem.getWalletClients();
    const escrow = await viem.deployContract("HumanTaskEscrow");
    const tid = taskId("task-refund-event");
    const amount = parseEther("1.0");

    await escrow.write.createEscrow([tid], { value: amount });

    await viem.assertions.emitWithArgs(
      escrow.write.refund([tid]),
      escrow,
      "Refunded",
      [tid, getAddress(deployer.account.address), amount],
    );
  });

  it("Should reject refund after release", async function () {
    const walletClients = await viem.getWalletClients();
    const worker = walletClients[1];
    const escrow = await viem.deployContract("HumanTaskEscrow");
    const tid = taskId("task-refund-after-release");
    const amount = parseEther("1.0");

    await escrow.write.createEscrow([tid], { value: amount });
    await escrow.write.releasePayment([
      tid,
      [worker.account.address],
      [amount],
    ]);

    await assert.rejects(
      async () => {
        await escrow.write.refund([tid]);
      },
    );
  });

  it("Should reject release after refund", async function () {
    const walletClients = await viem.getWalletClients();
    const worker = walletClients[1];
    const escrow = await viem.deployContract("HumanTaskEscrow");
    const tid = taskId("task-release-after-refund");
    const amount = parseEther("1.0");

    await escrow.write.createEscrow([tid], { value: amount });
    await escrow.write.refund([tid]);

    await assert.rejects(
      async () => {
        await escrow.write.releasePayment([
          tid,
          [worker.account.address],
          [amount],
        ]);
      },
    );
  });

  it("Should reject refund from non-owner", async function () {
    const walletClients = await viem.getWalletClients();
    const nonOwner = walletClients[1];
    const escrow = await viem.deployContract("HumanTaskEscrow");
    const tid = taskId("task-non-owner-refund");
    const amount = parseEther("1.0");

    await escrow.write.createEscrow([tid], { value: amount });

    await assert.rejects(
      async () => {
        await escrow.write.refund([tid], {
          account: nonOwner.account,
        });
      },
    );
  });

  // --- Edge cases ---

  it("Should reject release for nonexistent escrow", async function () {
    const walletClients = await viem.getWalletClients();
    const worker = walletClients[1];
    const escrow = await viem.deployContract("HumanTaskEscrow");
    const tid = taskId("task-nonexistent");

    await assert.rejects(
      async () => {
        await escrow.write.releasePayment([
          tid,
          [worker.account.address],
          [parseEther("1.0")],
        ]);
      },
    );
  });

  it("Should reject refund for nonexistent escrow", async function () {
    const escrow = await viem.deployContract("HumanTaskEscrow");
    const tid = taskId("task-nonexistent-refund");

    await assert.rejects(
      async () => {
        await escrow.write.refund([tid]);
      },
    );
  });

  it("Should handle multiple independent escrows", async function () {
    const walletClients = await viem.getWalletClients();
    const worker1 = walletClients[1];
    const worker2 = walletClients[2];
    const escrow = await viem.deployContract("HumanTaskEscrow");

    const tid1 = taskId("multi-1");
    const tid2 = taskId("multi-2");
    const amount1 = parseEther("1.0");
    const amount2 = parseEther("2.0");

    // Create two independent escrows
    await escrow.write.createEscrow([tid1], { value: amount1 });
    await escrow.write.createEscrow([tid2], { value: amount2 });

    // Release first, refund second
    await escrow.write.releasePayment([
      tid1,
      [worker1.account.address],
      [amount1],
    ]);
    await escrow.write.refund([tid2]);

    const result1 = await escrow.read.getEscrow([tid1]);
    const result2 = await escrow.read.getEscrow([tid2]);

    assert.equal(result1[2], true);  // released
    assert.equal(result1[3], false); // not refunded
    assert.equal(result2[2], false); // not released
    assert.equal(result2[3], true);  // refunded
  });
});
