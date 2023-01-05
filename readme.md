# Getting Started with Bundlr on Devnet

[Bundlr](https://docs.bundlr.network/) is a decentralized storage scaling solution that allows you to quickly store files to the [permaweb](https://arweave.medium.com/welcome-to-the-permaweb-ce0e6c73ddfb) with a low-cost, one-time fee using tokens you already own from the blockchains you already know and love (e.g. Polygon (Matic), Ethereum, Solana, Near, etc.)

While the service offered by the Bundlr platform is excellent, beginners may have a tough time getting up and running with a starter project that's fueled by test funds that connect to the Bundlr test network.

This project provides boilerplate code that can be used to take the guesswork out of the process so that you can focus application / business logic.

Fair warning, I've taken a rather opinionated approach to structuring the code, but you're free to fork the code and make it your own. If you have some suggestions on how I can make this codebase even better, you can send me a pull request.

## Getting Started

1. Rename the .env.sample file to .env
2. Replace the Wallet key with the private key of your wallet of choice
3. (Optional) If you would like to use another network other than Polygon(e.g. Near, Solana, etc.), simply replace the global settings in the bundlr.config.js file and you'll be up and running with your network of choice.
