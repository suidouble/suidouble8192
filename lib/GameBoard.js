const LEFT = 0;
const RIGHT = 1;
const UP = 2;
const DOWN = 3;
const ALL = 4;

const EMPTY = 0;
const TILE2 = 1;
const TILE4 = 2;
const TILE8 = 3;
const TILE16 = 4;
const TILE32 = 5;
const TILE64 = 6;
const TILE128 = 7;
const TILE256 = 8;
const TILE512 = 9;
const TILE1024 = 10;
const TILE2048 = 11;
const TILE4096 = 12;
const TILE8192 = 13;

const ESpaceEmpty = 0;
const ESpaceNotEmpty = 1;
const ENoEmptySpaces = 2;
const EGameOver = 3;

const ROW_COUNT = 4;
const COLUMN_COUNT = 4;

class SpacePosition {
    constructor(params = {}) {
        this.row = params.row || 0,
        this.column = params.column || 0;
    }
};

class PackedSpaces {
    constructor(params = {}) {
        this.rows = {};
        this.topTileValue = 0;
    }
    forEach(callback) {
        for (let ri = 0; ri < ROW_COUNT; ri++) {
            for (let ci = 0; ci < COLUMN_COUNT; ci++) {
                callback(ri, ci, this.at(ri, ci));
            }
        }
    }
    at(row_index, column_index) {
        try {
            if (this.rows[''+row_index][''+column_index]) {
                return this.rows[''+row_index][''+column_index];
            }
        } catch (e) {
            return EMPTY;
        }

        return EMPTY;
    }
    set(row_index, column_index, value) {
        if (!this.rows[''+row_index]) {
            this.rows[''+row_index] = {};
        }
        this.rows[''+row_index][''+column_index] = value;

        if (value > this.topTileValue) {
            this.topTileValue = value;
        }
    }
    packed() {
        const packed = [];
        for (let ri = 0; ri < ROW_COUNT; ri++) {
            const rowAsStrings = [];
            for (let ci = 0; ci < COLUMN_COUNT; ci++) {
                const v = (''+this.at(ri, ci));
                rowAsStrings.push(v);
            }
            packed.push(rowAsStrings.join('|'));
        }
        return packed.join('_');
    }
    toCBoard() {
        let board = BigInt(0);
        let i = 0;
        for (let ri = 0; ri < ROW_COUNT; ri++) {
            for (let ci = 0; ci < COLUMN_COUNT; ci++) {
                const v = BigInt(this.at(ri, ci));
                board |= (v << BigInt(4*i));
                i += 1;
            }
        }
        return board;
    }
    copy() {
        const packedSpaces = new PackedSpaces();
        packedSpaces.rows = JSON.parse(JSON.stringify(this.rows));
        packedSpaces.topTileValue = this.topTileValue;

        return packedSpaces;        
    }
    static fromPacked(packed) {
        const rows = packed.split('_');
        const rowsCount = rows.length;
        let columnCount = 0;

        const packedSpaces = new PackedSpaces();
        for (let ri = 0; ri < rowsCount; ri++) {
            const row = rows[ri].split('|');
            if (!columnCount) {
                columnCount = row.length;
            }
            for (let ci = 0; ci < columnCount; ci++) {
                const asInt = parseInt(row[ci], 10);
                packedSpaces.set(ri, ci, asInt);
            }
        }

        return packedSpaces;
    }
    log() {
        for (let ri = 0; ri < ROW_COUNT; ri++) {
            const rowAsStrings = [];
            for (let ci = 0; ci < COLUMN_COUNT; ci++) {
                const v = this.at(ri, ci);

                let asString = ('').padEnd(8, ' ');
                if (v) {
                    asString = (''+(Math.pow(2,v)) ).padEnd(8, ' ');
                }
                rowAsStrings.push(asString);
            }

            const s = '| '+rowAsStrings.join(' | ') + ' |';
            if (ri == 0) {
                console.log('--------'.padEnd(s.length, '-'));
            }
            console.log(s);
            console.log('--------'.padEnd(s.length, '-'));
        }
    }

    getTopTile() {
        return this.topTileValue;
    }
}

class GameBoard {
    constructor(params = {}) {
        this.packed_spaces = new PackedSpaces();
        if (params.packed_spaces) {
            this.packed_spaces = params.packed_spaces;
        }
        this.score = 0;
        this.last_tile = null;
        // this.top_tile = null;  // there is getter

        this.game_over = false;
        this.move_count = 0;
    }

    copy() {
        const packedSpacesCopy = PackedSpaces.fromPacked(this.packed_spaces.packed());
        const copy = new GameBoard({
            packed_spaces: packedSpacesCopy,
        });
        copy.score = 0 + this.score;
        copy.game_over = !!this.game_over;

        return copy;
    }

    get emptySpaceCount() {
        return this.empty_space_count();
    }

    packed() {
        return this.packed_spaces.packed();
    }

    move_direction(direction) {
        if (this.game_over) {
            throw new Error('game is already over');
        }

        let exising_packed = this.packed_spaces.packed();
        // let existing_spaces = *&game_board.packed_spaces;
        const move_result = this.move_spaces(direction);
        const top_tile = move_result[1];
        const add = move_result[2];

        let changed_packed = this.packed_spaces.packed();
        this.move_count++;

        // let (packed_spaces, top_tile, add) = move_spaces(game_board.packed_spaces, direction);
        // game_board.packed_spaces = packed_spaces;

        if (exising_packed == changed_packed) {
            // nothing is changed
            if (!this.move_possible()) {
                this.game_over = true;
            }
            return;
        }

        // if (existing_spaces == game_board.packed_spaces) {
        //     if (!move_possible(game_board)) {
        //         game_board.game_over = true;
        //     };
            
        //     return
        // };

        this.score = this.score + add;

        let new_tile = this.add_new_tile(direction);

        if (!this.move_possible()) {
            this.game_over = true;
        };
    }

    log() {
        return this.packed_spaces.log();
    }

    get top_tile() {
        return this.packed_spaces.getTopTile();
    }

    space_at(row_index, column_index) {
        return GameBoard.space_at(this.packed_spaces, row_index, column_index);
    }

    empty_space_positions(direction) {
        let empty_spaces = [];

        let rows = ROW_COUNT;
        let columns = COLUMN_COUNT;
        let starter_row = 0;
        let starter_column = 0;

        if (direction != ALL) {
            if (direction == LEFT) {
                starter_row = 0;
                starter_column = 3;
            } else if (direction == RIGHT) {
                columns = 1;
            } else if (direction == UP) {
                starter_row = 3;
                starter_column = 0;
            } else if (direction == DOWN) {
                rows = 1;
            };
        };

        let row = starter_row;
        while (row < rows) {
          let column = starter_column;
          while (column < columns) {
            let space = this.space_at(row, column);
            if (space == EMPTY) {
                empty_spaces.push(new SpacePosition({ row, column }));
            };
            column = column + 1;
          };
          row = row + 1;
        };

        return empty_spaces;
    }

    empty_space_count() {
        return (this.empty_space_positions(ALL)).length;
    }

    move_possible() {
        let rows = ROW_COUNT;
        let columns = COLUMN_COUNT;
        
        let row = 0;
        while (row < rows) {
            let column = 0;
            while (column < columns) {
                let space = this.space_at(row, column);
                if (space == EMPTY) {
                    return true
                };

                if (column < columns - 1) {
                    let right_space = this.space_at(row, column + 1);
                    if (right_space == EMPTY || right_space == space) {
                        return true
                    }
                };

                if (row < rows - 1) {
                    let down_space = this.space_at(row + 1, column);
                    if (down_space == EMPTY || down_space == space) {
                        return true
                    }
                };
                
                column = column + 1;
            };
            row = row + 1;
        };

        return false
    }

    move_spaces(direction) {
        const packed_space = this.packed_spaces;

        let current_direction = direction;
        
        let top_tile = 1;
        let score_addition = 0;

        let relevant_row = 0;
        if (current_direction == DOWN) {
            relevant_row = ROW_COUNT - 1;
        };

        let relevant_column = 0;
        if (current_direction == RIGHT) {
            relevant_column = COLUMN_COUNT  - 1;
        };
                
        let last_empty_index = 99;

        let spaces_at = this.spaces_at(
            relevant_row, 
            relevant_column, 
            current_direction
        );
        let space1 = spaces_at[0];
        let space2 = spaces_at[1];
        let space3 = spaces_at[2];
        let space4 = spaces_at[3];

        let original_space1 = space1;
        let original_space2 = space2;
        let original_space3 = space3;
        let original_space4 = space4;

        let space_index = 1;
        let next_space_index = 2;

        while (true) {
            if (next_space_index > ROW_COUNT) {
                this.save_spaces(
                    relevant_row, 
                    relevant_column, 
                    space1, 
                    space2, 
                    space3, 
                    space4,
                    original_space1 != space1,
                    original_space2 != space2,
                    original_space3 != space3,
                    original_space4 != space4, 
                    current_direction
                );

                relevant_row = this.next_row(relevant_row, current_direction);
                relevant_column = this.next_column(relevant_column, current_direction);

                if (!this.valid_row(relevant_row) || !this.valid_column(relevant_column)) {
                    break
                };

                let spaces_at = this.spaces_at(
                    relevant_row, 
                    relevant_column, 
                    current_direction
                );            
                space1 = spaces_at[0];
                space2 = spaces_at[1];
                space3 = spaces_at[2];
                space4 = spaces_at[3];            

                last_empty_index = 99;

                original_space1 = space1;
                original_space2 = space2;
                original_space3 = space3;
                original_space4 = space4;

                space_index = 1; 
                next_space_index = 2;
            };

            let space;
            if (space_index == 1) { space = space1 }
            else if (space_index == 2) { space = space2 }
            else if (space_index == 3) { space = space3 }
            else { space = space4 };

            let next_space;
            if (next_space_index == 1) { next_space = space1 }
            else if (next_space_index == 2) { next_space = space2 }
            else if (next_space_index == 3) { next_space = space3 }
            else { next_space = space4 };

            if (space == EMPTY) {
                last_empty_index = space_index;
            } else if (space > top_tile) {
                top_tile = space;
            };

            if (next_space == EMPTY) {
                if (last_empty_index == 99) {
                    last_empty_index = next_space_index;
                };
            } else {
                if (next_space == space) {
                    let score = 2;
                    let space_steps = space;
                    while (space_steps > 0) {
                        score = score * 2;
                        space_steps = space_steps - 1;
                    };
                    score_addition = score_addition + score;

                    if (space + 1 > top_tile) {
                        top_tile = space + 1;
                    };

                    if (space_index == 1) {
                        space1 = space + 1;
                    } else if (space_index == 2) {
                        space2 = space + 1;
                    } else if (space_index == 3) {
                        space3 = space + 1;
                    } else {
                        space4 = space + 1;
                    };

                    if (next_space_index == 1) {
                        space1 = EMPTY;
                    } else if (next_space_index == 2) {
                        space2 = EMPTY;
                    } else if (next_space_index == 3) {
                        space3 = EMPTY;
                    } else {
                        space4 = EMPTY;
                    };

                    if (last_empty_index != 99) {
                        space_index = last_empty_index;
                    } else {
                        space_index = next_space_index;
                    };

                    next_space_index = space_index;
                } else if (next_space != space) {
                    if (last_empty_index != 99) {

                        if (last_empty_index == 1) {
                            space1 = next_space;
                        } else if (last_empty_index == 2) {
                            space2 = next_space;
                        } else if (last_empty_index == 3) {
                            space3 = next_space;
                        } else {
                            space4 = next_space;
                        };
                        
                        if (next_space_index == 1) {
                            space1 = EMPTY;
                        } else if (next_space_index == 2) {
                            space2 = EMPTY;
                        } else if (next_space_index == 3) {
                            space3 = EMPTY;
                        } else {
                            space4 = EMPTY;
                        };
                        

                        space_index = last_empty_index;
                        next_space_index = space_index;
                        last_empty_index = 99;
                    } else {
                        space_index = next_space_index;
                    }               
                };
            };

            next_space_index = next_space_index + 1;
        }; 

        return [packed_space, top_tile, score_addition];
        // (packed_spaces, top_tile, score_addition)
    }

    next_row(row, direction) {
        if (direction == RIGHT || direction == LEFT) {
            return row + 1
        };
        return row;
    }

    next_column(column, direction) {
        if (direction == DOWN || direction == UP) {
            return column + 1
        };
        return column;
    }

    valid_row(row) {
        return (row >= 0 && row < ROW_COUNT);
    }

    valid_column(column) {
        return (column >= 0 && column < COLUMN_COUNT);
    }

    save_spaces(row_index, column_index, space1, space2, space3, space4, space1Changed, space2Changed, space3Changed, space4Changed, direction) {
        const packed_spaces = this.packed_spaces;
        if (direction == LEFT) {
            if (space1Changed) packed_spaces.set(row_index, 0, space1);
            if (space2Changed) packed_spaces.set(row_index, 1, space2);
            if (space3Changed) packed_spaces.set(row_index, 2, space3);
            if (space4Changed) packed_spaces.set(row_index, 3, space4);
        } else if (direction == RIGHT) {
            if (space1Changed) packed_spaces.set(row_index, 3, space1);
            if (space2Changed) packed_spaces.set(row_index, 2, space2);
            if (space3Changed) packed_spaces.set(row_index, 1, space3);
            if (space4Changed) packed_spaces.set(row_index, 0, space4);
        } else if (direction == UP) {
            if (space1Changed) packed_spaces.set(0, column_index, space1);
            if (space2Changed) packed_spaces.set(1, column_index, space2);
            if (space3Changed) packed_spaces.set(2, column_index, space3);
            if (space4Changed) packed_spaces.set(3, column_index, space4);
        } else if (direction == DOWN) {
            if (space1Changed) packed_spaces.set(3, column_index, space1);
            if (space2Changed) packed_spaces.set(2, column_index, space2);
            if (space3Changed) packed_spaces.set(1, column_index, space3);
            if (space4Changed) packed_spaces.set(0, column_index, space4);
        };

        return packed_spaces;
    }

    spaces_at(row_index, column_index, direction) {
        let space1;
        let space2;
        let space3;
        let space4;
        if (direction == LEFT) {
            space1 = this.space_at(row_index, 0);
            space2 = this.space_at(row_index, 1);
            space3 = this.space_at(row_index, 2);
            space4 = this.space_at(row_index, 3);
        } else if (direction == RIGHT) {
            space1 = this.space_at(row_index, 3);
            space2 = this.space_at(row_index, 2);
            space3 = this.space_at(row_index, 1);
            space4 = this.space_at(row_index, 0);
        } else if (direction == UP) {
            space1 = this.space_at(0, column_index);
            space2 = this.space_at(1, column_index);
            space3 = this.space_at(2, column_index);
            space4 = this.space_at(3, column_index);
        } else {
            space1 = this.space_at(3, column_index);
            space2 = this.space_at(2, column_index);
            space3 = this.space_at(1, column_index);
            space4 = this.space_at(0, column_index);
        };

        return [space1, space2, space3, space4];
    }

    add_new_tile(direction) {
        let empty_spaces = this.empty_space_positions(direction);

        let empty_spaces_count = empty_spaces.length;
        if (!empty_spaces_count) {
            throw new Error('no empty spaces');
        }

        const randomValue = Math.floor(Math.random() * 1000000);
        const randomValue2 = Math.floor(Math.random() * 1000000);

        let tile = TILE2;
        let top = this.top_tile;
        if (top >= TILE8192 && randomValue % 6 == 0) {
            tile = TILE32; 
        } else if (top >= TILE4096 && randomValue % 5 == 0) {
            tile = TILE16; 
        } else if (top >= TILE2048 && randomValue % 4 == 0) {
            tile = TILE8; 
        } else if (randomValue % 4 == 0) {
            tile = TILE4; 
        };

        let random_empty_position = randomValue2 % empty_spaces_count;
        let empty_space = empty_spaces[random_empty_position];// vector::borrow(&empty_spaces, random_empty_position);

        this.packed_spaces.set(empty_space.row, empty_space.column, tile);

        // let packed_spaces = fill_in_space_at(game_board.packed_spaces, empty_space.row, empty_space.column, tile);
        // game_board.packed_spaces = packed_spaces;

        this.last_tile = [empty_space.row, empty_space.column, tile];
        return tile;

        // game_board.last_tile = vector[(empty_space.row as u64), (empty_space.column as u64), (tile as u64)];

        // tile
    }

    static default() {
        let packed_spaces = new PackedSpaces();

        let row1 = Math.floor( (Math.random() * 100000) % 2 );
        let column1 = Math.floor( (Math.random() * 100000) % 4 );
        packed_spaces = GameBoard.fill_in_space_at(packed_spaces, row1, column1, TILE2);

        // console.log('added', GameBoard.space_at(packed_spaces, row1, column1));

        let row2 = Math.floor( (Math.random() * 100000) % 2 + 2);
        let column2 = Math.floor( (Math.random() * 100000) % 4 );
        packed_spaces = GameBoard.fill_in_space_at(packed_spaces, row2, column2, TILE2);

        const gameBoard = new GameBoard({
            packed_spaces: packed_spaces,
        });

        return gameBoard;
    }

    static fill_in_space_at(packed_space, row_index, column_index, value) {
        packed_space.set(row_index, column_index, value);
        return packed_space;
        // return packed_space | value << (ROW_COUNT * (column_index + row_index * COLUMN_COUNT));
    }

    static replace_value_at(packed_space, row_index, column_index, value) {
        packed_space.set(row_index, column_index, value);
        return packed_space;
        // let shift_bits = (ROW_COUNT * (column_index + row_index * COLUMN_COUNT));
        // let mask = (0xF << shift_bits) ^ 0xFFFFFFFFFFFFFFFF;
        
        // return (packed_space & mask) | (value << shift_bits);
    }

    static space_at(packed_space, row_index, column_index) {
        return packed_space.at(row_index, column_index);
        // return (packed_space >> (row_index * COLUMN_COUNT + column_index) * ROW_COUNT) & 0xF;
    }
};

module.exports = GameBoard;