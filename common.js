const config = require("./config.json");

const readlineInterface = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout,
  });
const readline = require('readline');
const directionToParam = { left: 0, right: 1, up: 2, down: 3, };
let keyPressResolver = null;

process.stdin.on('keypress', function(s, key) {
    if (keyPressResolver) {
        if (key.name == 'up' || key.name == 'down' || key.name == 'left' || key.name == 'right') {
            keyPressResolver(key.name);
            keyPressResolver = null;
        }
    }
});

function clearConsole() {
	if (process.stdout.isTTY) {
		const blank = '\n'.repeat(process.stdout.rows);
		console.log(blank);
		readline.cursorTo(process.stdout, 0, 0);
		readline.clearScreenDown(process.stdout);
	}
}

const clearConsoleIfNeeded = ()=>{
    if (config.clearScreen) {
        clearConsole();
    }
};

const awaitDirection = async(timeout = null)=>{
    if (!timeout) {
        timeout = config.waitKey;
    }

    const promise = new Promise((res)=>{
        keyPressResolver = res;
    });
    if (!timeout) {
        return await promise;
    } else {
        const key = await Promise.race([promise, new Promise((res)=>{setTimeout(res, timeout)})]);
        keyPressResolver = null;
        return key;
    }
};

module.exports = {
    awaitDirection: awaitDirection,
    clearConsoleIfNeeded: clearConsoleIfNeeded,
};