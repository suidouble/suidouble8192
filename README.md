### SUI8192 CLI

CLI app and bot to play [SUI8192 game](https://sui8192.ethoswallet.xyz/). 

On-chain (mainnet, testnet, or localnet testing) / In-memory practice

AI-mode / Manual (press arrows to play) 

<img src="https://suidouble.github.io/sui_videos/8192.gif" height="200">

Built with [suidouble](https://github.com/suidouble/suidouble) library for interacting with SUI blockchain Move smart contracts. No other dependencies.

Don't forget to check your address with [sui bot score analizer](https://github.com/suidouble/suidouble-bot-score) to determine if you may be suspected as a bot.

#### installation

```bash
mkdir suidouble8192
cd suidouble8192
git clone git@github.com:suidouble/suidouble8192.git .
npm install
```

#### AI / Manual

AI is not too smart, don't expect it to get you close to the #1 place in the leaderboard, but may get into top100 with some luck(Note to Ethos team: rep was private till the very deadline and I am not going to go through kyc myself), feel free to fork and adjust GameBoardPredicter class (ping me if you have ideas about AI features to use or brave enough to add tensorflow or something over there).

Adjust `waitKey` setting in `config.json` to play manually or in AI-mode. (waitKey - ms to wait for you to press the arrow key before bot plays itself). Set it to `60000` and it waits for 1 minute for you to press the key, set it to `1` - and the AI will play not waiting for you.

#### play offline

```bash
node play_offline.js
```

Play the game in memory. No blockchain interaction. GameBoard class is the re-write of [Ethos' Sui8192 Move classes](https://github.com/EthosWallet/Sui8192) in javascript, so the game logic is the same as on blockchain (or should be the same, let me know if you find some bug).

#### play on chain

Edit `config.json` file and set your wallet secret phrase(reminder! do not commit it to git) and chain name ('mainnet' or 'testnet' would work). Run:

```bash
node play_on_chain.js
```

to create the game on blockchain and start playing it. Don't forget that it takes 0.2 SUI to create a gameboard (as per smart contract) and some gas (~ 0.00085 SUI) for every transaction. So be sure you have some SUI on your wallet (if on testnet, bot tries to get some SUI from faucet though it's not always available).

Bot stops playing if:

    - game is over

    - there're > 10 recuring transaction errors

    - on exit

To continue the game, set its id as `continueGameId` in config.json. You can restart the bot anytime if continueGameId is set. Or just stop the bot anytime and continue playing in SUI8192 web version.

#### play on localnet

```bash
node play_on_local.js
```

Builds and deploys the game Move module (`move` folder is the fork from [original Ethos github](https://github.com/EthosWallet/Sui8192)) to localnet sui node and runs bot over it. Localnet should be active and availiable (`RUST_LOG="consensus=off" sui-test-validator`) and sui binaries installed (so exec `sui move build` works). Check [SUI's docs](https://docs.sui.io/) for local sui installation info.

#### license

MIT