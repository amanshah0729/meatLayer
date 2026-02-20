// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract HumanTaskEscrow {
    struct Escrow {
        address depositor;
        uint256 amount;
        bool released;
        bool refunded;
    }

    address public owner;
    mapping(bytes32 => Escrow) public escrows;

    event EscrowCreated(bytes32 indexed taskId, address indexed depositor, uint256 amount);
    event PaymentReleased(bytes32 indexed taskId, address[] workers, uint256[] amounts);
    event Refunded(bytes32 indexed taskId, address indexed depositor, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function createEscrow(bytes32 taskId) external payable {
        require(msg.value > 0, "Must send funds");
        require(escrows[taskId].amount == 0, "Escrow already exists");

        escrows[taskId] = Escrow({
            depositor: msg.sender,
            amount: msg.value,
            released: false,
            refunded: false
        });

        emit EscrowCreated(taskId, msg.sender, msg.value);
    }

    function releasePayment(
        bytes32 taskId,
        address[] calldata workers,
        uint256[] calldata amounts
    ) external onlyOwner {
        Escrow storage escrow = escrows[taskId];
        require(escrow.amount > 0, "No escrow found");
        require(!escrow.released, "Already released");
        require(!escrow.refunded, "Already refunded");
        require(workers.length == amounts.length, "Length mismatch");

        uint256 total = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            total += amounts[i];
        }
        require(total <= escrow.amount, "Exceeds escrowed amount");

        escrow.released = true;

        for (uint256 i = 0; i < workers.length; i++) {
            (bool sent, ) = workers[i].call{value: amounts[i]}("");
            require(sent, "Payment failed");
        }

        uint256 remainder = escrow.amount - total;
        if (remainder > 0) {
            (bool sent, ) = escrow.depositor.call{value: remainder}("");
            require(sent, "Remainder refund failed");
        }

        emit PaymentReleased(taskId, workers, amounts);
    }

    function refund(bytes32 taskId) external onlyOwner {
        Escrow storage escrow = escrows[taskId];
        require(escrow.amount > 0, "No escrow found");
        require(!escrow.released, "Already released");
        require(!escrow.refunded, "Already refunded");

        escrow.refunded = true;

        (bool sent, ) = escrow.depositor.call{value: escrow.amount}("");
        require(sent, "Refund failed");

        emit Refunded(taskId, escrow.depositor, escrow.amount);
    }

    function getEscrow(bytes32 taskId) external view returns (
        address depositor,
        uint256 amount,
        bool released,
        bool refunded
    ) {
        Escrow memory e = escrows[taskId];
        return (e.depositor, e.amount, e.released, e.refunded);
    }
}
