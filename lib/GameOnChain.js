const { SuiMaster } = require('suidouble');
const GameBoard = require('./GameBoard.js');

class GameOnChain {
    constructor(params = {}) {
        this._chain = params.chain || 'mainnet';
        this._id = params.id || null;

        this._contractAddress = params.contract || null;
        if (!this._contractAddress && this._chain == 'mainnet') {
            //https://github.com/EthosWallet/Sui8192/blob/main/js/constants.js
            this._contractAddress = '0x72f9c76421170b5a797432ba9e1b3b2e2b7cf6faa26eb955396c773af2479e1e';
        } else if (!this._contractAddress && this._chain == 'testnet') {
            this._contractAddress = '0x990570514ac706f0f33d87db6d0f12d3a98be00373836851363dee5fd70119f2';
        }

        this._maintainerAddress = params.maintainerAddress || null;
        if (this._chain == 'mainnet') {
            //https://github.com/EthosWallet/Sui8192/blob/main/js/constants.js
            this._maintainerAddress = '0x1d6d6770b9929e9d8233b31348f035a2a552d8427ae07d6413d1f88939f3807f';
        } else if (this._chain == 'testnet') {
            this._maintainerAddress = '0x86942ec75d27f7caeabb94178a560c2819cd73a284405243b0aab13a15feb9b6';
        }

        this._as = params.as || null;
        this._phrase = params.phrase || null;

        this._readOnly = true;

        this._suiMaster = null; // so we can requestSuiFromFaucet
        this._module = null;
        this._moduleInitialized = false;

        this._currentBoardVersion = null;
        this._currentGameBoard = null;

        this._errorsCount = 0;
        this._lastScores = [];

        this._debug = params.debug || false;
    }

    get errorsCount() {
        return this._errorsCount;
    }

    async requestSuiFromFaucet() {
        await this.initModule();
        try {
            await this._suiMaster.requestSuiFromFaucet();
        } catch (e) {

        }
    }

    async makeMove(direction) {
        if (!this._id) {
            throw new Error('no game defined');
        }
        await this.initModule();

        let directionAsInt = direction;
        // we can optionally pass direction as string
        const directionToParam = { left: 0, right: 1, up: 2, down: 3, };
        if (directionToParam[direction] || directionToParam[direction] === 0) {
            directionAsInt = directionToParam[direction];
        }

        const moveCallParams = [
            this._id,
            directionAsInt,
        ];

        const movesBeforeTheCall = this._currentGameBoard.move_count;
        let res = null;
        try {
            res = await this._module.moveCall('make_move', moveCallParams);
        } catch(e) {
            res = null;
        }

        if (res && res.status && res.status == 'success') {
            const allEqual = arr => arr.every( v => v === arr[0] );
            if (this._lastScores.length == 10 && allEqual(this._lastScores)) {
                // last 10 moves give the same score. Something unusual (but ok on local, as non-perfect random number generator as id generation)
                this._errorsCount++;
            }

            // trying to get updated board from results,
            const gameObject = this._module.objectStorage.byAddress(this._id);
            this.suiObjectToGameBoard(gameObject);
            // but it's not always possbile, we may have to wait for next block?
            return await this.waitForTheMovesHigherThan(movesBeforeTheCall);

        } else {
            this._errorsCount++;
        }

        return null;
    }

    async waitForTheMovesHigherThan(move_count) {
        console.log('waing for move_count > ', move_count);
        if (this._currentGameBoard && this._currentGameBoard.move_count > move_count) {
            return this._currentGameBoard;
        }

        do {
            await new Promise((res)=>setTimeout(res, 5000));
            await this.getGameBoard();
            if (this._currentGameBoard && this._currentGameBoard.move_count > move_count) {
                return this._currentGameBoard;
            }
        } while(true);
    }

    async getGameBoard() {
        await this.initModule();
        if (!this._id) {
            return null;
        }

        // lazy add id
        this._module.pushObject(this._id); // add game object to storage so we can fetch it right away

        await this._module.fetchObjects();

        const gameObject = this._module.objectStorage.byAddress(this._id);
        this.suiObjectToGameBoard(gameObject);

        return this._currentGameBoard;
    }

    suiObjectToGameBoard(obj) {
        const COLUMNS = 4;
        const ROWS = 4;
        const spaceAt = (packedSpaces, row, column) => {
            return Number((BigInt(packedSpaces) >> BigInt((row * COLUMNS + column) * ROWS)) & BigInt(0xF));
        }

        const move_count = parseInt(''+obj.fields.move_count, 10);
        const score = parseInt(''+obj.fields.score);
        const game_over = !!obj.fields.game_over;
        const packed_spaces = obj.fields.active_board.fields.packed_spaces;

        const gameBoard = new GameBoard();
        gameBoard.move_count = move_count;
        gameBoard.score = score;
        gameBoard.game_over = game_over;

        for (let ci = 0; ci < COLUMNS; ci++) {
            for (let ri = 0; ri < ROWS; ri++) {
                gameBoard.packed_spaces.set(ri, ci, spaceAt(packed_spaces, ri, ci));
            }
        }

        const version = obj._version;
        if (!this._currentBoardVersion || version > this._currentBoardVersion) {
            this._currentBoardVersion = version;
            this._currentGameBoard = gameBoard;

            const scoreOnMove = gameBoard.score;
            this._lastScores.push(scoreOnMove);
            if (this._lastScores.length > 10) {
                this._lastScores.shift();
            }
        }

        return gameBoard;
    }

    async initModule() {
        if (this._moduleInitialized) {
            return true;
        }

        const suiMaster = new SuiMaster({provider: this._chain, as: this._as, phrase: this._phrase, debug: this._debug});
        await suiMaster.initialize();

        const currentUserBalance = await suiMaster.getBalance();
        console.error(currentUserBalance);

        const contract = suiMaster.addPackage({
            id: this._contractAddress,
        });

        this._suiMaster = suiMaster;
        this._module = await contract.getModule('game_8192');

        this._moduleInitialized = true;

        return true;
    }

    async create() {
        if (this._id) {
            throw new Error('already have game id? Are you rich enough to create new one?');
        }


        await this.initModule();

        const moveCallParams = [
            this._maintainerAddress,
            [{ type: 'SUI', amount: 200000000 }], // fee as vector<Coin<SUI>>
        ];

        const res = await this._module.moveCall('create', moveCallParams);

        console.log(res);
        if (res && res.created && res.created.length) {
            for (const obj of res.created) {
                console.log(obj.typeName, obj.id);
                if (obj.typeName == 'Game8192') {
                    // we are ok, created
                    console.log('created', obj.id);
                    this._id = obj.id;
                    return await this.getGameBoard();
                }
            }
        }

        return null;
    }
};

module.exports = GameOnChain;
