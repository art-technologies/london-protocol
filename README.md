# Sample Hardhat Project

Verse ERC721 factory and protocol.

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat run scripts/deploy.ts
```

## Compile and generate types

```
npx hardhat node
```

```shell
npx hardhat compile
```

## Run tests

```shell
npx hardhat test ./test/LondonTokenFactory.ts
```

## Deploy
If verifying via Etherscan (deploying via Remix) need to specify optimisations. 
```
npx hardhat run ./scripts/deployBase.ts --network sepolia
npx hardhat verify --network sepolia 0x7d6AEfE699f6da6a4597f0f1FE1DdADe5D56Cc6a
 
npx hardhat run ./scripts/deploy.ts --network sepolia
```