const GameOnLocal = require('./lib/GameOnLocal.js');
const GameOnChain = require('./lib/GameOnChain.js');
const GameBoardPredicter = require('./lib/GameBoardPredicter.js');
const config = require("./config.json");

const PlayCommon = require("./common.js");

const run = async() =>{
    const gameOnLocal = new GameOnLocal();

    const gameBoardPredicter = new GameBoardPredicter({
        ks: {
            emptySpaceCount: 10000,
            // distanceBetweenTwoHighest: 50,
            distanceOfHighestToCorner: 5000,
            emptySpacesNear4sCount: 0.000001,
            emptySpacesNear2sCount: 0.000001,
        },
        forces: {
            innerIsAverage: false,
            // stepSamples: 20,
            // stepSamplesInternal: 10,
            // innerSteps: 3,
            stepSamples: 3,
            stepSamplesInternal: 2,
            innerSteps: 1,
        },
    });

    await gameOnLocal.publish();

    const gameOnChain = new GameOnChain(gameOnLocal);

    let gameBoard = await gameOnChain.create();

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
        // await new Promise((res)=>setTimeout(res, 200));

        if (gameOnChain.errorsCount > 10) {
            throw new Error('too much errors :( ');
        }
    } while(true);
};

run();