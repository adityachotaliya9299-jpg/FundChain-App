// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title FundChainNFT
 * @notice Backer reward NFTs — Bronze / Silver / Gold tiers
 * @dev Minted by the FundChain main contract (set as minter)
 */
contract FundChainNFT is ERC721URIStorage, Ownable {

    uint256 private _tokenIds;
    address public minter; // = FundChain main contract

    uint256 public bronzeThreshold = 0.01 ether;
    uint256 public silverThreshold = 0.05 ether;
    uint256 public goldThreshold   = 0.10 ether;

    // donor => campaignId => highest tier minted (0=none,1=bronze,2=silver,3=gold)
    mapping(address => mapping(uint256 => uint8)) public tierMinted;

    event NFTMinted(address indexed recipient, uint256 tokenId, string tier, uint256 campaignId);

    constructor() ERC721("FundChain Backer", "FCB") Ownable(msg.sender) {}

    modifier onlyMinter() {
        require(msg.sender == minter || msg.sender == owner(), "Not minter");
        _;
    }

    function setMinter(address _minter) external onlyOwner {
        minter = _minter;
    }

    function setThresholds(uint256 _bronze, uint256 _silver, uint256 _gold) external onlyOwner {
        bronzeThreshold = _bronze;
        silverThreshold = _silver;
        goldThreshold   = _gold;
    }

    /**
     * @notice Called after each donation to check if a new tier NFT should be minted
     */
    function tryMint(address _recipient, uint256 _totalDonated, uint256 _campaignId) external onlyMinter {
        uint8 newTier;
        string memory tierName;
        string memory uri;

        if (_totalDonated >= goldThreshold) {
            newTier  = 3;
            tierName = "Gold";
            uri      = "ipfs://QmGoldBadgeFundChain";
        } else if (_totalDonated >= silverThreshold) {
            newTier  = 2;
            tierName = "Silver";
            uri      = "ipfs://QmSilverBadgeFundChain";
        } else if (_totalDonated >= bronzeThreshold) {
            newTier  = 1;
            tierName = "Bronze";
            uri      = "ipfs://QmBronzeBadgeFundChain";
        } else {
            return; // below min threshold
        }

        // Only mint if they've upgraded to a higher tier
        if (newTier <= tierMinted[_recipient][_campaignId]) return;

        tierMinted[_recipient][_campaignId] = newTier;

        _tokenIds++;
        _mint(_recipient, _tokenIds);
        _setTokenURI(_tokenIds, uri);

        emit NFTMinted(_recipient, _tokenIds, tierName, _campaignId);
    }

    function totalMinted() public view returns (uint256) {
        return _tokenIds;
    }
}
