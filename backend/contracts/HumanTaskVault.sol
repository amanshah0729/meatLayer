// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract HumanTaskVault {
    struct Deposit {
        address depositor;
        uint256 amount;
        bool refunded;
    }

    address public owner;
    mapping(bytes32 => Deposit) public deposits;
    uint256 public totalDeposited;

    event Deposited(bytes32 indexed taskId, address indexed depositor, uint256 amount);
    event Withdrawn(address indexed worker, uint256 amount);
    event Refunded(bytes32 indexed taskId, address indexed depositor, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /// @notice Agent deposits funds for a task into the vault.
    function deposit(bytes32 taskId) external payable {
        require(msg.value > 0, "Must send funds");
        require(deposits[taskId].amount == 0, "Deposit already exists");

        deposits[taskId] = Deposit({
            depositor: msg.sender,
            amount: msg.value,
            refunded: false
        });

        totalDeposited += msg.value;
        emit Deposited(taskId, msg.sender, msg.value);
    }

    /// @notice Backend calls this to pay a worker. Amount owed is tracked off-chain in the DB.
    function withdraw(address payable worker, uint256 amount) external onlyOwner {
        require(worker != address(0), "Invalid address");
        require(amount > 0, "Amount must be > 0");
        require(address(this).balance >= amount, "Insufficient vault balance");

        (bool sent, ) = worker.call{value: amount}("");
        require(sent, "Transfer failed");

        emit Withdrawn(worker, amount);
    }

    /// @notice Refund a task deposit back to the original depositor.
    function refund(bytes32 taskId) external onlyOwner {
        Deposit storage dep = deposits[taskId];
        require(dep.amount > 0, "No deposit found");
        require(!dep.refunded, "Already refunded");

        dep.refunded = true;

        (bool sent, ) = dep.depositor.call{value: dep.amount}("");
        require(sent, "Refund failed");

        emit Refunded(taskId, dep.depositor, dep.amount);
    }

    /// @notice View deposit details for a task.
    function getDeposit(bytes32 taskId) external view returns (
        address depositor,
        uint256 amount,
        bool refunded
    ) {
        Deposit memory d = deposits[taskId];
        return (d.depositor, d.amount, d.refunded);
    }

    /// @notice Check the total balance held by the vault.
    function vaultBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
