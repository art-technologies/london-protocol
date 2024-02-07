# Verse NFT contracts

Verse ERC721 factory and protocol.

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat run scripts/deploy.ts
```

## Compile and generate types

```shell
npx hardhat compile
```

## Run tests

```shell
npx hardhat test ./test/LondonTokenFactory.ts
```

## Deploy

```shell
multisol contracts/LondonTokenFactory.sol
```

## Verify

1. Deploy `LondonTokenFactory` (Remix).
1. Verify `LondonTokenFactory` (Remix).
1. Deploy `LondonToken` (Remix)
1. Verify `LondonToken` (Remix)
1. Deploy `LondonToken` via `createCollection` method
1. Verify `LondonToken` (Etherscan).
