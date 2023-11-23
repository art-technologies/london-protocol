// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./ERC721.sol";
import "./ERC2981PerTokenRoyalties.sol";
import "./fs/OnchainFileStorage.sol";

/// @custom:security-contact contact@verse.works
contract LondonTokenBase is
    ERC721,
    Ownable,
    ERC2981PerTokenRoyalties,
    OnchainFileStorage
{
    constructor() ERC721("", "VERSE", "") {}

    function initialize(
        string memory uri_,
        address minter_,
        address gatewayManager_,
        string memory contractName_,
        uint256 royaltyValue_,
        address owner_
    ) public {
        require(bytes(_name).length == 0, "Already initialized");
        _name = contractName_;
        _baseUri = uri_;
        mintingManager = minter_;
        gatewayManager = gatewayManager_;
        _setTokenRoyalty(owner_, royaltyValue_);
        creator = owner_;
        _transferOwnership(owner_);
    }

    uint256 public totalSupply;

    address public creator;

    address public mintingManager;

    address public gatewayManager;

    /**
        On Chain parameters.
     */
    mapping(uint256 => string) public _payloads;
    string public artistName;
    string public projectName;
    string public projectDescription;
    string public website;
    string public notes;
    string public license;

    /**
     * @dev Creates a token with `id`, and assigns them to `to`.
     * Method emits two transfer events.
     *
     * Emits a {Transfer} event.
     *
     * Requirements:
     *
     * - `to` cannot be the zero address.
     */
    function mint(
        address to,
        uint256 tokenId,
        string memory payload
    ) public onlyMinter {
        require(to != address(0), "mint to the zero address");
        require(!_exists(tokenId), "ERC721: token already minted");

        _balances[to] += 1;
        totalSupply += 1;
        _owners[tokenId] = to;
        _payloads[tokenId] = payload;

        emit Transfer(address(0), creator, tokenId);
        emit Transfer(creator, to, tokenId);
    }

    /**
     * @dev Creates a token with `id`, and assigns them to `to`.
     * Method emits two transfer events.
     *
     * Emits a {Transfer} events for intermediate artist.
     *
     * Requirements:
     *
     * - `to` cannot be the zero address.
     * - If `to` refers to a smart contract, it must implement {IERC1155Receiver-onERC1155Received} and return the
     * acceptance magic value.
     */
    function mintBatch(
        address[] memory to,
        uint256[] memory tokenIds,
        string[] memory payloads
    ) public onlyMinter {
        require(tokenIds.length == to.length, "Arrays length mismatch");

        for (uint256 i = 0; i < tokenIds.length; i++) {
            mint(to[i], tokenIds[i], payloads[i]);
        }
    }

    /**
     * @dev Creates a token with `id`, and assigns them to `to`.
     * In addition it sets the royalties for `royaltyRecipient` of the value `royaltyValue`.
     * Method emits two transfer events.
     *
     * Emits a {Transfer} event.
     *
     * Requirements:
     *
     * - `to` cannot be the zero address.
     */
    function mintWithCreator(address to, uint256 tokenId) public onlyMinter {
        mint(to, tokenId, "");
    }

    /**
     * @dev Creates a token with `id`, and assigns them to `to`.
     * Method emits two transfer events.
     *
     * Emits a {Transfer} events for intermediate artist.
     *
     * Requirements:
     *
     * - `to` cannot be the zero address.
     * - If `to` refers to a smart contract, it must implement {IERC1155Receiver-onERC1155Received} and return the
     * acceptance magic value.
     */
    function batchMintWithCreator(
        address[] memory to,
        uint256[] memory tokenIds
    ) public onlyMinter {
        require(tokenIds.length == to.length, "Arrays length mismatch");

        for (uint256 i = 0; i < tokenIds.length; i++) {
            mint(to[i], tokenIds[i], "");
        }
    }

    modifier onlyMinter() {
        require(msg.sender == mintingManager, "Permission denied");
        _;
    }

    modifier onlyGatewayManager() {
        require(msg.sender == gatewayManager, "Permission denied");
        _;
    }

    function tokenURI(
        uint256 tokenId
    ) public view override(ERC721) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    /**
     * @dev Checks for supported interface.
     *
     */
    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override(ERC721, ERC2981Base) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    /**
     * @dev Sets royalties for `tokenId` and `tokenRecipient` with royalty value `royaltyValue`.
     *
     */
    function setRoyalties(
        address royaltyRecipient,
        uint256 royaltyValue
    ) public onlyOwner {
        _setTokenRoyalty(royaltyRecipient, royaltyValue);
    }

    /**
     * @dev Sets new minter for the contract.
     *
     */
    function setMintingManager(address minter_) public onlyOwner {
        mintingManager = minter_;
    }

    /**
     * @dev Sets new gateway manager for the contract.
     *
     */
    function setGatewayManager(address gatewayManager_) public onlyOwner {
        gatewayManager = gatewayManager_;
    }

    /**
     * @dev Sets base URI for metadata.
     *
     */
    function setURI(string memory newuri) public onlyGatewayManager {
        _setURI(newuri);
    }
}
