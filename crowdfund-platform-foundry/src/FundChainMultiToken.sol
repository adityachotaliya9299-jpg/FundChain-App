// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function decimals() external view returns (uint8);
}

/**
 * @title FundChainMultiToken
 * @notice Accept ETH, USDT, USDC donations for campaigns
 */
contract FundChainMultiToken {

    // ─────────────────────────────────────────────
    //  STRUCTS
    // ─────────────────────────────────────────────

    struct TokenDonation {
        address token;    // address(0) = ETH
        uint256 amount;
        address donor;
        uint256 timestamp;
    }

    // ─────────────────────────────────────────────
    //  STATE
    // ─────────────────────────────────────────────

    address public owner;

    // Sepolia testnet addresses
    address public USDC_ADDRESS = 0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238; // Sepolia USDC
    address public USDT_ADDRESS = 0x7169D38820dfd117C3FA1f22a697dBA58d90BA06; // Sepolia USDT

    // campaignId => token => total collected
    mapping(uint256 => mapping(address => uint256)) public tokenCollected;

    // campaignId => donations list
    mapping(uint256 => TokenDonation[]) public campaignDonations;

    // donor => campaignId => token => amount
    mapping(address => mapping(uint256 => mapping(address => uint256))) public donorTokenAmounts;

    // Supported tokens list
    address[] public supportedTokens;
    mapping(address => bool) public isSupported;
    mapping(address => string) public tokenSymbol;

    // ─────────────────────────────────────────────
    //  EVENTS
    // ─────────────────────────────────────────────

    event TokenDonated(uint256 indexed campaignId, address indexed donor, address token, uint256 amount);
    event TokenWithdrawn(uint256 indexed campaignId, address token, uint256 amount);
    event TokenAdded(address token, string symbol);

    // ─────────────────────────────────────────────
    //  CONSTRUCTOR
    // ─────────────────────────────────────────────

    constructor() {
        owner = msg.sender;

        // Add ETH
        supportedTokens.push(address(0));
        isSupported[address(0)] = true;
        tokenSymbol[address(0)] = "ETH";

        // Add USDC
        supportedTokens.push(USDC_ADDRESS);
        isSupported[USDC_ADDRESS] = true;
        tokenSymbol[USDC_ADDRESS] = "USDC";

        // Add USDT
        supportedTokens.push(USDT_ADDRESS);
        isSupported[USDT_ADDRESS] = true;
        tokenSymbol[USDT_ADDRESS] = "USDT";
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    // ─────────────────────────────────────────────
    //  DONATE WITH ETH
    // ─────────────────────────────────────────────

    function donateETH(uint256 _campaignId) external payable {
        require(msg.value > 0, "Send ETH");

        tokenCollected[_campaignId][address(0)] += msg.value;
        donorTokenAmounts[msg.sender][_campaignId][address(0)] += msg.value;

        campaignDonations[_campaignId].push(TokenDonation({
            token:     address(0),
            amount:    msg.value,
            donor:     msg.sender,
            timestamp: block.timestamp
        }));

        emit TokenDonated(_campaignId, msg.sender, address(0), msg.value);
    }

    // ─────────────────────────────────────────────
    //  DONATE WITH ERC20 (USDC/USDT)
    // ─────────────────────────────────────────────

    function donateToken(uint256 _campaignId, address _token, uint256 _amount) external {
        require(isSupported[_token], "Token not supported");
        require(_token != address(0), "Use donateETH for ETH");
        require(_amount > 0, "Amount must be > 0");

        IERC20 token = IERC20(_token);
        require(token.transferFrom(msg.sender, address(this), _amount), "Transfer failed");

        tokenCollected[_campaignId][_token] += _amount;
        donorTokenAmounts[msg.sender][_campaignId][_token] += _amount;

        campaignDonations[_campaignId].push(TokenDonation({
            token:     _token,
            amount:    _amount,
            donor:     msg.sender,
            timestamp: block.timestamp
        }));

        emit TokenDonated(_campaignId, msg.sender, _token, _amount);
    }

    // ─────────────────────────────────────────────
    //  WITHDRAW
    // ─────────────────────────────────────────────

    function withdrawETH(uint256 _campaignId, address payable _to) external onlyOwner {
        uint256 amount = tokenCollected[_campaignId][address(0)];
        require(amount > 0, "Nothing to withdraw");
        tokenCollected[_campaignId][address(0)] = 0;
        (bool sent,) = _to.call{value: amount}("");
        require(sent, "ETH transfer failed");
        emit TokenWithdrawn(_campaignId, address(0), amount);
    }

    function withdrawToken(uint256 _campaignId, address _token, address _to) external onlyOwner {
        uint256 amount = tokenCollected[_campaignId][_token];
        require(amount > 0, "Nothing to withdraw");
        tokenCollected[_campaignId][_token] = 0;
        require(IERC20(_token).transfer(_to, amount), "Token transfer failed");
        emit TokenWithdrawn(_campaignId, _token, amount);
    }

    // ─────────────────────────────────────────────
    //  ADD CUSTOM TOKEN
    // ─────────────────────────────────────────────

    function addToken(address _token, string memory _symbol) external onlyOwner {
        require(!isSupported[_token], "Already supported");
        supportedTokens.push(_token);
        isSupported[_token] = true;
        tokenSymbol[_token] = _symbol;
        emit TokenAdded(_token, _symbol);
    }

    // ─────────────────────────────────────────────
    //  VIEW FUNCTIONS
    // ─────────────────────────────────────────────

    function getCampaignBalance(uint256 _campaignId) external view returns (
        address[] memory tokens,
        uint256[] memory amounts,
        string[] memory symbols
    ) {
        tokens  = supportedTokens;
        amounts = new uint256[](supportedTokens.length);
        symbols = new string[](supportedTokens.length);
        for (uint i = 0; i < supportedTokens.length; i++) {
            amounts[i] = tokenCollected[_campaignId][supportedTokens[i]];
            symbols[i] = tokenSymbol[supportedTokens[i]];
        }
    }

    function getCampaignDonations(uint256 _campaignId) external view returns (TokenDonation[] memory) {
        return campaignDonations[_campaignId];
    }

    function getSupportedTokens() external view returns (address[] memory, string[] memory) {
        string[] memory symbols = new string[](supportedTokens.length);
        for (uint i = 0; i < supportedTokens.length; i++) {
            symbols[i] = tokenSymbol[supportedTokens[i]];
        }
        return (supportedTokens, symbols);
    }
}
