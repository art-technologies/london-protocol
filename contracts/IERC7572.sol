pragma solidity 0.8.13;

/**
 * @title IERC7572
 * @dev Interface for contract-level metadata as per EIP-7572 (Draft).
 *      This includes a `contractURI()` function and a corresponding event.
 */
interface IERC7572 {
    /**
     * @dev Returns the contract-level metadata URI.
     */
    function contractURI() external view returns (string memory);

    /**
     * @dev Emitted when the contract-level metadata URI is updated.
     */
    event ContractURIUpdated(string newContractURI);
}