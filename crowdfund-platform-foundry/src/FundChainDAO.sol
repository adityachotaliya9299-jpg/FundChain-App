// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title FundChainDAO
 * @notice Backers vote on how campaign funds are spent
 * @dev Deploy separately, linked to FundChain main contract
 */
contract FundChainDAO {

    // ─────────────────────────────────────────────
    //  STRUCTS
    // ─────────────────────────────────────────────

    struct Proposal {
        uint256 campaignId;
        string  title;
        string  description;
        uint256 requestedAmount;  // in wei
        address payable recipient;
        uint256 votesFor;
        uint256 votesAgainst;
        uint256 deadline;         // voting deadline timestamp
        bool    executed;
        bool    cancelled;
        address proposer;
    }

    // ─────────────────────────────────────────────
    //  STATE
    // ─────────────────────────────────────────────

    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    mapping(uint256 => mapping(address => uint256)) public voterWeight; // donation amount = voting power

    uint256 public proposalCount;
    address public mainContract; // FundChain main contract address
    address public owner;

    uint256 public constant VOTING_PERIOD = 3 days;
    uint256 public constant MIN_QUORUM_PERCENT = 20; // 20% of backers must vote

    // ─────────────────────────────────────────────
    //  EVENTS
    // ─────────────────────────────────────────────

    event ProposalCreated(uint256 indexed proposalId, uint256 campaignId, string title, uint256 amount);
    event Voted(uint256 indexed proposalId, address voter, bool support, uint256 weight);
    event ProposalExecuted(uint256 indexed proposalId);
    event ProposalCancelled(uint256 indexed proposalId);

    // ─────────────────────────────────────────────
    //  CONSTRUCTOR
    // ─────────────────────────────────────────────

    constructor(address _mainContract) {
        mainContract = _mainContract;
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    // ─────────────────────────────────────────────
    //  CREATE PROPOSAL
    // ─────────────────────────────────────────────

    function createProposal(
        uint256 _campaignId,
        string memory _title,
        string memory _description,
        uint256 _requestedAmount,
        address payable _recipient
    ) external returns (uint256) {
        require(bytes(_title).length > 0, "Title required");
        require(_requestedAmount > 0, "Amount must be > 0");
        require(_recipient != address(0), "Invalid recipient");

        proposals[proposalCount] = Proposal({
            campaignId:      _campaignId,
            title:           _title,
            description:     _description,
            requestedAmount: _requestedAmount,
            recipient:       _recipient,
            votesFor:        0,
            votesAgainst:    0,
            deadline:        block.timestamp + VOTING_PERIOD,
            executed:        false,
            cancelled:       false,
            proposer:        msg.sender
        });

        emit ProposalCreated(proposalCount, _campaignId, _title, _requestedAmount);
        proposalCount++;
        return proposalCount - 1;
    }

    // ─────────────────────────────────────────────
    //  VOTE
    // ─────────────────────────────────────────────

    /**
     * @param _proposalId The proposal to vote on
     * @param _support true = FOR, false = AGAINST
     * @param _donationWeight How much ETH the voter donated (verified off-chain via frontend)
     */
    function vote(uint256 _proposalId, bool _support, uint256 _donationWeight) external {
        Proposal storage p = proposals[_proposalId];
        require(block.timestamp < p.deadline, "Voting ended");
        require(!p.executed, "Already executed");
        require(!p.cancelled, "Cancelled");
        require(!hasVoted[_proposalId][msg.sender], "Already voted");
        require(_donationWeight > 0, "Must be a backer to vote");

        hasVoted[_proposalId][msg.sender] = true;
        voterWeight[_proposalId][msg.sender] = _donationWeight;

        if (_support) {
            p.votesFor += _donationWeight;
        } else {
            p.votesAgainst += _donationWeight;
        }

        emit Voted(_proposalId, msg.sender, _support, _donationWeight);
    }

    // ─────────────────────────────────────────────
    //  EXECUTE PROPOSAL
    // ─────────────────────────────────────────────

    function executeProposal(uint256 _proposalId) external {
        Proposal storage p = proposals[_proposalId];
        require(block.timestamp >= p.deadline, "Voting still active");
        require(!p.executed, "Already executed");
        require(!p.cancelled, "Cancelled");
        require(p.votesFor > p.votesAgainst, "Proposal rejected");
        require(address(this).balance >= p.requestedAmount, "Insufficient funds");

        p.executed = true;
        (bool sent, ) = p.recipient.call{value: p.requestedAmount}("");
        require(sent, "Transfer failed");

        emit ProposalExecuted(_proposalId);
    }

    // ─────────────────────────────────────────────
    //  CANCEL PROPOSAL
    // ─────────────────────────────────────────────

    function cancelProposal(uint256 _proposalId) external {
        Proposal storage p = proposals[_proposalId];
        require(msg.sender == p.proposer || msg.sender == owner, "Not authorized");
        require(!p.executed, "Already executed");
        p.cancelled = true;
        emit ProposalCancelled(_proposalId);
    }

    // ─────────────────────────────────────────────
    //  FUND THE DAO (receive ETH)
    // ─────────────────────────────────────────────

    receive() external payable {}

    function deposit() external payable {}

    // ─────────────────────────────────────────────
    //  VIEW FUNCTIONS
    // ─────────────────────────────────────────────

    function getProposal(uint256 _id) external view returns (Proposal memory) {
        return proposals[_id];
    }

    function getAllProposals() external view returns (Proposal[] memory) {
        Proposal[] memory all = new Proposal[](proposalCount);
        for (uint i = 0; i < proposalCount; i++) {
            all[i] = proposals[i];
        }
        return all;
    }

    function getProposalsByCampaign(uint256 _campaignId) external view returns (uint256[] memory) {
        uint256 count = 0;
        for (uint i = 0; i < proposalCount; i++) {
            if (proposals[i].campaignId == _campaignId) count++;
        }
        uint256[] memory ids = new uint256[](count);
        uint256 idx = 0;
        for (uint i = 0; i < proposalCount; i++) {
            if (proposals[i].campaignId == _campaignId) {
                ids[idx++] = i;
            }
        }
        return ids;
    }

    function getVoteStatus(uint256 _proposalId) external view returns (
        uint256 votesFor,
        uint256 votesAgainst,
        bool isActive,
        bool isPassed
    ) {
        Proposal storage p = proposals[_proposalId];
        return (
            p.votesFor,
            p.votesAgainst,
            block.timestamp < p.deadline && !p.executed && !p.cancelled,
            p.votesFor > p.votesAgainst
        );
    }

    function setMainContract(address _main) external onlyOwner {
        mainContract = _main;
    }
}
