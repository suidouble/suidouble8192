const { SuiMaster } = require('suidouble');
const path = require('path');

class GameOnLocal {
    constructor() {
        this._isPublished = false;
        this._contractAddress = null;
        this._maintainerAddress = null;
    }

    // getters, so we can pass this object directly as GameOnChain constructor params
    get chain() {
        return 'local';
    }

    get as() {
        // pseudo-random string for suidouble private key generator
        if (this.__as) {
            return this.__as;
        }

        this.__as = 'admin'+Math.random();
        return this.__as;
    }

    get contract() {
        return this._contractAddress;
    }

    get maintainerAddress() {
        return this._maintainerAddress;
    }

    async publish() {
        const suiMaster = new SuiMaster({provider: 'local', as: this.as, debug: true});
        await suiMaster.initialize();
        await suiMaster.requestSuiFromFaucet();

        const contract = suiMaster.addPackage({
            path: path.join(__dirname, '../move/'),
        });

        // lets try to build it
        await contract.build();

        // and publish
        await contract.publish();

        this._contractAddress = contract.id;

        // find maintainer
        const found = contract.objectStorage.find((obj)=>(obj.typeName == 'Game8192Maintainer'));
        this._maintainerAddress = found.id;

        this._isPublished = true;
    }
}

module.exports = GameOnLocal;