const directionToParam = {
    left: 0, right: 1, up: 2, down: 3,
};

const GameBoard = require('./GameBoard.js');

class GameBoardPredicter {
    constructor(params = {}) {
        this.gameBoard = params.gameBoard;
        // if (!this.gameBoard) {
        //     throw new Error('gameBoard is required');
        // }
        if (!params.ks) {
            params.ks = {};
        }

        this.ks = {
            emptySpaceCount: params.ks.emptySpaceCount || 5,
            distanceBetweenTwoHighest: params.ks.distanceBetweenTwoHighest || 5,
            distanceOfHighestToCorner: params.ks.distanceOfHighestToCorner || 5,
            differenceBetweenHighest: params.ks.differenceBetweenHighest || 5,
            differenceBetweenHighest2: params.ks.differenceBetweenHighest2 || 5,
            emptySpacesNear2sCount: params.ks.emptySpacesNear2sCount || 5,
            emptySpacesNear4sCount: params.ks.emptySpacesNear4sCount || 5,
            distanceOfHighestToEdge: params.ks.distanceOfHighestToEdge || 5,
        };

        if (!params.forces) {
            params.forces = {};
        }

        this.forces = {
            stepSamples: params.forces.stepSamples || 1,
            stepSamplesInternal: params.forces.stepSamplesInternal || 1,
            innerSteps: params.forces.innerSteps || 1,
            innerIsAverage: params.forces.innerIsAverage || false,
        };
    }

    static simulateAndGetAverageScore(gameBoardPredicter, numPlays = 10) {
        let totalScore = 0;
        let allScores = [];
        const startedAt = new Date();
        let overallMoves = 0;
        for (let i = 0; i < numPlays; i++) {
            let thisPlayScore = 0;
            let gameBoard = null;
            try {
                gameBoard = GameBoard.default();
                do {
                    const bestMove = gameBoardPredicter.whatIsTheBestMoveOf(gameBoard);
                    gameBoard.move_direction(directionToParam[bestMove]);
                    console.log(gameBoard.score);
                } while(!gameBoard.game_over);
            } catch (e) {
            }
            // gameBoard.log();
            thisPlayScore = gameBoard.score;
            totalScore+=thisPlayScore;

            overallMoves += gameBoard.move_count;
            // console.log(gameBoard.move_count);

            allScores.push(thisPlayScore);

            // console.log(gameBoardPredicter.calculateFeaturesOf(gameBoard));

            console.log('played a game and got', thisPlayScore, 'score');
            console.log('ms to move: ', ((new Date()).getTime() - startedAt.getTime()) / overallMoves );
        }


        allScores = allScores.sort();
        let meanTotalScore = 0;
        let meanTotalScoreCount = 0;
        let getRidOfP = Math.floor(0.2 * numPlays); 
        for (let i = getRidOfP; i < numPlays - getRidOfP; i++){
            meanTotalScoreCount++;
            meanTotalScore += allScores[i];
        }
        let topTotalScore = 0;
        let topTotalScoreCount = 0;
        for (let i = numPlays - getRidOfP; i < numPlays; i++){
            if (allScores[i]) {
                topTotalScore += allScores[i];
                topTotalScoreCount++;
            }
        }


        // console.log(gameBoardPredicter.ks);

        console.log('average score is', (meanTotalScore/meanTotalScoreCount), (totalScore / numPlays), 'top: ', (topTotalScore / topTotalScoreCount));
    }

    calculateFeaturesOf(gameBoard) {
        const features = {
            emptySpaceCount: gameBoard.emptySpaceCount,
            emptySpacesNear2sCount: 0,
            emptySpacesNear4sCount: 0,
            distanceBetweenTwoHighest: 99,
            distanceOfHighestToCorner: 99,
            distanceOfHighestToEdge: 99,
            differenceBetweenHighest: 99,
            differenceBetweenHighest2: 99,
        };

        gameBoard.packed_spaces.forEach((ri, ci, v)=>{
            if (v == 1) { // "2"
                if (ri > 0) {
                    if (!gameBoard.packed_spaces.at(ri - 1, ci)) features.emptySpacesNear2sCount++;
                } 
                if (ri < 3) {
                    if (!gameBoard.packed_spaces.at(ri + 1, ci)) features.emptySpacesNear2sCount++;
                } 
                if (ci > 0) {
                    if (!gameBoard.packed_spaces.at(ri, ci - 1)) features.emptySpacesNear2sCount++;
                } 
                if (ci < 3) {
                    if (!gameBoard.packed_spaces.at(ri, ci + 1)) features.emptySpacesNear2sCount++;
                } 
            }
            if (v == 2) { // "4"
                if (ri > 0) {
                    if (!gameBoard.packed_spaces.at(ri - 1, ci)) features.emptySpacesNear4sCount++;
                } 
                if (ri < 3) {
                    if (!gameBoard.packed_spaces.at(ri + 1, ci)) features.emptySpacesNear4sCount++;
                } 
                if (ci > 0) {
                    if (!gameBoard.packed_spaces.at(ri, ci - 1)) features.emptySpacesNear4sCount++;
                } 
                if (ci < 3) {
                    if (!gameBoard.packed_spaces.at(ri, ci + 1)) features.emptySpacesNear4sCount++;
                } 
            }
        });

        // get distance between 2 highest items
        let highest1 = 0;
        let highest1ci = 0; let highest1ri = 0;
        let highest2 = 0;
        let highest2ci = 0; let highest2ri = 0;
        let highest3 = 0;
        let highest3ci = 0; let highest3ri = 0;

        gameBoard.packed_spaces.forEach((ri, ci, v)=>{
            if (v > highest1) {
                highest1 = v;
                highest1ri = ri;
                highest1ci = ci;
            }
        });
        gameBoard.packed_spaces.forEach((ri, ci, v)=>{
            if (v > highest2 && (ri != highest1ri || ci != highest1ci)) {
                highest2 = v;
                highest2ri = ri;
                highest2ci = ci;
            }
        });
        gameBoard.packed_spaces.forEach((ri, ci, v)=>{
            if (v > highest3 && (ri != highest1ri || ci != highest1ci) && (ri != highest2ri || ci != highest2ci)) {
                highest3 = v;
                highest3ri = ri;
                highest3ci = ci;
            }
        });

        let distanceOfHighestToEdge = Math.min(highest1ci, highest1ri, 3-highest1ci, 3-highest1ri);
        features.distanceOfHighestToEdge = 4 - distanceOfHighestToEdge;

        // const differenceBetweenHighest = (highest1 - highest2) + (highest2 - highest3);
        features.differenceBetweenHighest = 13 - (highest1 - highest2);
        features.differenceBetweenHighest2 = 13 - (highest2 - highest3);

        // console.log('highest points are', highest1ri, highest1ci, 'and', highest2ri, highest2ci)
        const distance1 = Math.hypot(highest2ri-highest1ri, highest2ci-highest1ci);
        const distance2 = Math.hypot(highest3ri-highest1ri, highest3ci-highest1ci);
        const distance3 = Math.hypot(highest3ri-highest2ri, highest3ci-highest2ci);

        const highest1Corner = Math.min(Math.hypot(0-highest1ri, 0-highest1ci),Math.hypot(3-highest1ri, 0-highest1ci),Math.hypot(3-highest1ri, 3-highest1ci),Math.hypot(0-highest1ri, 3-highest1ci));

        features.distanceOfHighestToCorner = 8 - highest1Corner;
        // gameBoard.log();
        // console.log('distanceOfHighestToCorner', features.distanceOfHighestToCorner);

        features.distanceBetweenTwoHighest = (8 - distance1);
        // console.log('distance between two highest points is: ', features.distanceBetweenTwoHighest);

        return features;
    }

    bestScoreIfGoesForWithAverage(gameBoard, depth = 0, maxDepth = 2, samplifyCount = 1) {
        let totalScore = 0;
        for (let i = 0; i < samplifyCount; i++) {
            totalScore += this.bestScoreIfGoesFor(gameBoard, depth, maxDepth);
        }

        return totalScore / samplifyCount;
    }

    bestScoreIfGoesFor(gameBoard, depth = 0, maxDepth = 2) {
        const copies = {
            up: gameBoard.copy(),
            down: gameBoard.copy(),
            left: gameBoard.copy(),
            right: gameBoard.copy(),
        };
        let maximumScore = 0;
        let totalScore = 0;
        for (const direction in copies) {
            try {
                copies[direction].move_direction(directionToParam[direction]);
                if (depth < maxDepth) {
                    let nextStepBestScore = this.bestScoreIfGoesFor(copies[direction], depth + 1, maxDepth);
                    if (nextStepBestScore > maximumScore) {
                        maximumScore = nextStepBestScore;
                    }
                    totalScore += nextStepBestScore;
                } else {
                    // const afterMoveScore = copies[direction].emptySpaceCount;
                    const features = this.calculateFeaturesOf(copies[direction]);

                    // console.log(direction, features.emptySpaceCount);
                    // const afterMoveScore = features.differenceBetweenHighest * 10 + features.distanceOfHighestToCorner * 1 + features.distanceBetweenTwoHighest * 1 + features.emptySpaceCount * 10;
                    // console.log(features);

                    let afterMoveScore = 0;
                    for (const featuresK in features) {
                        if (this.ks[featuresK]) {
                            afterMoveScore += features[featuresK] * this.ks[featuresK];
                        }
                    }

                    if (afterMoveScore > maximumScore) {
                        maximumScore = afterMoveScore;
                    }
                }
            } catch (e) {

            }
        }

        if (depth < maxDepth && this.forces.innerIsAverage) {
            return totalScore / 4;
        } 

        return maximumScore;
    }

    whatIsTheBestMoveOf(gameBoard = null, depth = 0) {
        if (!gameBoard) {
            gameBoard = this.gameBoard;
        }

        const currentState = gameBoard.packed();

        // this.calculateFeaturesOf(gameBoard);

        const copies = {
            up: null,
            down: null,
            left: null,
            right: null,
        };
        const afterMoveScores = {
            up: 0,
            down: 0,
            left: 0,
            right: 0,
        };

        const inDirectionSamplesCount = this.forces.stepSamples;

        let maximumScore = 5;
        let bestDirection = 'up';

        for (const direction in copies) {
            let inDirectionTotalScore = 0;

            let features = {};
            for (let i = 0; i < inDirectionSamplesCount; i++) {
                try {
                    copies[direction] = gameBoard.copy();
                    copies[direction].move_direction(directionToParam[direction]);
                    features = this.calculateFeaturesOf(copies[direction]);
    
                    let bestScore = this.bestScoreIfGoesForWithAverage(copies[direction], 0, this.forces.innerSteps, this.forces.stepSamplesInternal);

                    const newState = copies[direction].packed();
                    if (currentState == newState) {
                        bestScore = bestScore * 0.000001;
                    }

                    inDirectionTotalScore = inDirectionTotalScore + bestScore;
                } catch(e) {

                }
            }
            // console.log(features.emptySpaceCount);

            const score = inDirectionTotalScore / inDirectionSamplesCount;
            // console.log(direction, '-----', score);
            if (score > maximumScore) {
                maximumScore = score;
                bestDirection = direction;
            }

            // copies[direction].move_direction(directionToParam[direction]);
            // let bestScore = this.bestScoreIfGoesForWithAverage(copies[direction], 0, 1, 5);
            // // console.log('best score if goes '+direction+' is '+bestScore);
            // // afterMoveScores[direction] = copies[direction].emptySpaceCount;

            // if (bestScore > maximumScore) {
            //     maximumScore = bestScore;
            //     bestDirection = direction;
            // }
            // if (afterMoveScores[direction] > maximumScore) {
            //     maximumScore = afterMoveScores[direction];
            //     bestDirection = direction;
            // }
        }

        // console.log('best direction is: ', bestDirection);

        return bestDirection;
    }
}

module.exports = GameBoardPredicter;