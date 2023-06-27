'use strict'

const t = require('tap');
const { test } = t;

const LEFT = 0;
const RIGHT = 1;
const UP = 2;
const DOWN = 3;
const ALL = 4;

const GameBoard = require('../lib/GameBoard.js');
let gameBoard = null;

test('init', async t => {
    gameBoard = GameBoard.default();
    console.error(gameBoard.packed_spaces);
    console.error('0-0', gameBoard.space_at(0,0));
    console.error('empty_spaces', gameBoard.empty_space_positions(4));

    t.equal(gameBoard.empty_space_positions(4).length, 14); // 16 - 2 filled
    t.equal(gameBoard.empty_space_count(), 14);
    t.ok(gameBoard);

    t.ok(gameBoard.move_possible());

    gameBoard.add_new_tile(1);

    t.equal(gameBoard.empty_space_count(), 13);
    gameBoard.add_new_tile(1);
    t.equal(gameBoard.empty_space_count(), 12);

    gameBoard.log();
    console.log(gameBoard.packed());
    console.log(gameBoard.score);

    gameBoard.move_direction(UP);
    gameBoard.move_direction(LEFT);

    console.log('move');

    gameBoard.log();
    console.log(gameBoard.packed());
    console.log(gameBoard.score);

});