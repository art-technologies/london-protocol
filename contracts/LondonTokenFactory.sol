// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "./LondonTokenBase.sol";

/**
 * @title LondonTokenFactory
 * @notice This contract is used to create new instances of LondonTokenBase contracts.
 * Each new instance represents a new collection of tokens.
 */
contract LondonTokenFactory {
    event NewCollection(address);

    /**
     * @dev Address of the token implementation which will be used as a template for clones.
     */
    address immutable tokenImplementation;

    /**
     * @notice Constructor initializes a new instance of LondonTokenBase as the template for future clones.
     */
    constructor() {
        tokenImplementation = address(new LondonTokenBase());
    }

    /**
     * @notice Creates a new collection of London tokens.
     * @dev Deploys a clone of the LondonTokenBase and initializes it with the provided parameters.
     * @param uri_ The URI for the metadata of the collection.
     * @param minter_ The address allowed to mint new tokens in this collection.
     * @param gatewayManager_ The address of the gateway manager for cross-chain functionalities.
     * @param contractName_ The name of the new token contract.
     * @param royaltyValue_ The royalty value for secondary sales.
     * @param owner_ The owner of the new token collection.
     */
    function createCollection(
        string memory uri_,
        address minter_,
        address gatewayManager_,
        string memory contractName_,
        uint256 royaltyValue_,
        address owner_
    ) external {
        address clone = Clones.clone(tokenImplementation);
        LondonTokenBase(clone).initialize(
            uri_,
            minter_,
            gatewayManager_,
            contractName_,
            royaltyValue_,
            owner_
        );
        emit NewCollection(clone);
    }
}
