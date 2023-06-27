const GameOnChain = require('./lib/GameOnChain.js');
const GameBoardPredicter = require('./lib/GameBoardPredicter.js');

const config = require('./config.json');
const PlayCommon = require("./common.js");

const run = async() =>{
    const gameBoardPredicter = new GameBoardPredicter({
        ks: {
            emptySpaceCount: 1000,
            // distanceBetweenTwoHighest: 50,
            distanceOfHighestToCorner: 100,
            emptySpacesNear4sCount: 0.000001,
            emptySpacesNear2sCount: 0.000001,
        },
        forces: {
            innerIsAverage: false,
            stepSamples: 1,
            stepSamplesInternal: 1,
            innerSteps: 1,
            // stepSamples: 3,
            // stepSamplesInternal: 2,
            // innerSteps: 1,
        },
    });

    const gameOnChain = new GameOnChain({
        chain: config.chain,
        phrase: config.phrase,
        debug: config.debug,
    });

    let gameBoard = null;
    if (config.continueGameId) {
        gameOnChain._id = config.continueGameId;
        gameBoard = await gameOnChain.getGameBoard();
    } else {
        gameBoard = await gameOnChain.create();
        await new Promise((res)=>setTimeout(res, 60000));
    }

    console.log('created a game, id: ', gameOnChain._id);
    console.log('you can find and take a look at it at https://suiexplorer.com/');

    let lastMove = null;
    do {
        PlayCommon.clearConsoleIfNeeded();

        console.log('game id: ', gameOnChain._id, 'errors subiting transactions: ', gameOnChain.errorsCount);
        gameBoard.log();
        console.log('v:', gameOnChain._currentBoardVersion, 'score: '+gameBoard.score, 'moves: ',gameBoard.move_count, 'last move:', lastMove);
        const bestMove = gameBoardPredicter.whatIsTheBestMoveOf(gameBoard);
        console.log('recommened move is: ', bestMove);
        console.log('press direction key... or we will go with recommended');
        let direction = await PlayCommon.awaitDirection();
        if (!direction) {
            direction = bestMove;
        }

        lastMove = direction;

        console.log('executing transation...');
        const moveRes = await gameOnChain.makeMove(direction);
        if (moveRes !== null) {
            console.log('transation posted.');
        } else {
            console.log('error posting transaction.');
        }

        gameBoard = await gameOnChain.getGameBoard();

        if (gameBoard.game_over) {
            throw new Error('sad');
        }

        if (gameOnChain.errorsCount > 10) {
            throw new Error('too much errors :( ');
        }
    } while(true);
};

run();