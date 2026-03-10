// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title FundChain V2
 * @notice Crowdfunding with milestones, refunds, updates, and NFT badge events
 * @dev NFT minting is handled by a separate FundChainNFT contract
 */
contract FundChain {

    // ─────────────────────────────────────────────
    //  STRUCTS
    // ─────────────────────────────────────────────

    struct Milestone {
        string  title;
        uint256 targetAmount;
        bool    released;
    }

    struct Update {
        string  message;
        uint256 timestamp;
        address author;
    }

    struct Campaign {
        address  owner;
        string   title;
        string   description;
        string   category;
        uint256  target;
        uint256  deadline;
        uint256  amountCollected;
        string   image;
        bool     withdrawn;
        address[] donators;
        uint256[] donations;
    }

    // ─────────────────────────────────────────────
    //  STATE
    // ─────────────────────────────────────────────

    mapping(uint256 => Campaign)    public campaigns;
    mapping(uint256 => Milestone[]) public campaignMilestones;
    mapping(uint256 => Update[])    public campaignUpdates;
    mapping(address => mapping(uint256 => uint256)) public donorAmounts;

    uint256 public numberOfCampaigns;
    address public nftContract; // optional: set after deploying NFT contract
    address public owner;

    // ─────────────────────────────────────────────
    //  EVENTS
    // ─────────────────────────────────────────────

    event CampaignCreated(uint256 indexed id, address owner, string title, uint256 target);
    event DonationReceived(uint256 indexed id, address donator, uint256 amount);
    event FundsWithdrawn(uint256 indexed id, address owner, uint256 amount);
    event RefundIssued(uint256 indexed id, address donator, uint256 amount);
    event UpdatePosted(uint256 indexed id, string message, uint256 timestamp);
    event MilestoneReleased(uint256 indexed id, uint256 milestoneIndex, uint256 amount);

    // ─────────────────────────────────────────────
    //  CONSTRUCTOR
    // ─────────────────────────────────────────────

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    function setNFTContract(address _nft) external onlyOwner {
        nftContract = _nft;
    }

    // ─────────────────────────────────────────────
    //  CREATE CAMPAIGN
    // ─────────────────────────────────────────────

    function createCampaign(
        string   memory _title,
        string   memory _description,
        string   memory _category,
        uint256  _target,
        uint256  _deadline,
        string   memory _image,
        string[] memory _milestoneTitles,
        uint256[] memory _milestoneTargets
    ) public returns (uint256) {
        require(_deadline > block.timestamp, "Deadline must be future");
        require(_target > 0, "Target > 0");
        require(_milestoneTitles.length == _milestoneTargets.length, "Milestone mismatch");
        require(_milestoneTitles.length <= 5, "Max 5 milestones");

        Campaign storage c = campaigns[numberOfCampaigns];
        c.owner           = msg.sender;
        c.title           = _title;
        c.description     = _description;
        c.category        = _category;
        c.target          = _target;
        c.deadline        = _deadline;
        c.image           = _image;

        for (uint i = 0; i < _milestoneTitles.length; i++) {
            campaignMilestones[numberOfCampaigns].push(Milestone({
                title:        _milestoneTitles[i],
                targetAmount: _milestoneTargets[i],
                released:     false
            }));
        }

        emit CampaignCreated(numberOfCampaigns, msg.sender, _title, _target);
        numberOfCampaigns++;
        return numberOfCampaigns - 1;
    }

    // ─────────────────────────────────────────────
    //  DONATE
    // ─────────────────────────────────────────────

    function donateToCampaign(uint256 _id) public payable {
        require(_id < numberOfCampaigns, "Campaign not found");
        require(block.timestamp < campaigns[_id].deadline, "Campaign ended");
        require(msg.value > 0, "Send ETH");

        Campaign storage c = campaigns[_id];
        c.donators.push(msg.sender);
        c.donations.push(msg.value);
        c.amountCollected += msg.value;
        donorAmounts[msg.sender][_id] += msg.value;

        emit DonationReceived(_id, msg.sender, msg.value);
    }

    // ─────────────────────────────────────────────
    //  WITHDRAW (no milestones)
    // ─────────────────────────────────────────────

    function withdrawFunds(uint256 _id) public {
        Campaign storage c = campaigns[_id];
        require(msg.sender == c.owner, "Not owner");
        require(!c.withdrawn, "Already withdrawn");
        require(c.amountCollected >= c.target, "Target not reached");
        require(campaignMilestones[_id].length == 0, "Use releaseMilestone");

        c.withdrawn = true;
        (bool sent, ) = payable(c.owner).call{value: c.amountCollected}("");
        require(sent, "Transfer failed");

        emit FundsWithdrawn(_id, c.owner, c.amountCollected);
    }

    // ─────────────────────────────────────────────
    //  MILESTONE RELEASE
    // ─────────────────────────────────────────────

    function releaseMilestone(uint256 _id, uint256 _idx) public {
        Campaign storage c = campaigns[_id];
        require(msg.sender == c.owner, "Not owner");
        require(_idx < campaignMilestones[_id].length, "Invalid milestone");

        Milestone storage m = campaignMilestones[_id][_idx];
        require(!m.released, "Already released");
        require(c.amountCollected >= m.targetAmount, "Target not reached");

        uint256 releaseAmount = _idx == 0
            ? m.targetAmount
            : m.targetAmount - campaignMilestones[_id][_idx - 1].targetAmount;

        m.released = true;
        (bool sent, ) = payable(c.owner).call{value: releaseAmount}("");
        require(sent, "Transfer failed");

        emit MilestoneReleased(_id, _idx, releaseAmount);
    }

    // ─────────────────────────────────────────────
    //  REFUND
    // ─────────────────────────────────────────────

    function claimRefund(uint256 _id) public {
        Campaign storage c = campaigns[_id];
        require(block.timestamp > c.deadline, "Campaign still active");
        require(c.amountCollected < c.target, "Target was reached");

        uint256 amount = donorAmounts[msg.sender][_id];
        require(amount > 0, "Nothing to refund");

        donorAmounts[msg.sender][_id] = 0;
        (bool sent, ) = payable(msg.sender).call{value: amount}("");
        require(sent, "Refund failed");

        emit RefundIssued(_id, msg.sender, amount);
    }

    // ─────────────────────────────────────────────
    //  CAMPAIGN UPDATES
    // ─────────────────────────────────────────────

    function postUpdate(uint256 _id, string memory _message) public {
        require(_id < numberOfCampaigns, "Campaign not found");
        require(msg.sender == campaigns[_id].owner, "Not owner");
        require(bytes(_message).length > 0, "Empty message");

        campaignUpdates[_id].push(Update({
            message:   _message,
            timestamp: block.timestamp,
            author:    msg.sender
        }));

        emit UpdatePosted(_id, _message, block.timestamp);
    }

    // ─────────────────────────────────────────────
    //  VIEW FUNCTIONS
    // ─────────────────────────────────────────────

    function getCampaigns() public view returns (Campaign[] memory) {
        Campaign[] memory all = new Campaign[](numberOfCampaigns);
        for (uint i = 0; i < numberOfCampaigns; i++) {
            all[i] = campaigns[i];
        }
        return all;
    }

    function getCampaignMilestones(uint256 _id) public view returns (Milestone[] memory) {
        return campaignMilestones[_id];
    }

    function getCampaignUpdates(uint256 _id) public view returns (Update[] memory) {
        return campaignUpdates[_id];
    }

    function getDonators(uint256 _id) public view returns (address[] memory, uint256[] memory) {
        return (campaigns[_id].donators, campaigns[_id].donations);
    }

    function canClaimRefund(address _donor, uint256 _id) public view returns (bool) {
        Campaign storage c = campaigns[_id];
        return donorAmounts[_donor][_id] > 0
            && block.timestamp > c.deadline
            && c.amountCollected < c.target;
    }

    function getRefundAmount(address _donor, uint256 _id) public view returns (uint256) {
        return donorAmounts[_donor][_id];
    }
}
