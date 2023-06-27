
const GameBoardPredicter = require('./lib/GameBoardPredicter.js');
const GameBoard = require('./lib/GameBoard.js');

const config = require("./config.json");

const PlayCommon = require("./common.js");
const directionToParam = {
    left: 0, right: 1, up: 2, down: 3,
};

const run = async() =>{
    const gameBoard = GameBoard.default();

    const gameBoardPredicter = new GameBoardPredicter({
        ks: {
            emptySpaceCount: 10000,
            // distanceBetweenTwoHighest: 50,
            distanceOfHighestToEdge: 100000,
            emptySpacesNear4sCount: 0.000001,
            emptySpacesNear2sCount: 0.000001,
        },
        forces: {
            innerIsAverage: false,
            stepSamples: 5,
            stepSamplesInternal: 5,
            innerSteps: 3,
        },
    });

    let lastMove = null;
    do {
        PlayCommon.clearConsoleIfNeeded();

        gameBoard.log();
        console.log('score: '+gameBoard.score, 'moves: ',gameBoard.move_count, 'last move:', lastMove, 'gameover', gameBoard.game_over);
        const bestMove = gameBoardPredicter.whatIsTheBestMoveOf(gameBoard);
        console.log('recommened move is: ', bestMove);
        console.log('press direction key... or we will go with recommended');
        
        let direction = await PlayCommon.awaitDirection();
        if (!direction) {
            direction = bestMove;
        }

        lastMove = direction;
        gameBoard.move_direction(directionToParam[direction]);
    } while(true);
};

run();