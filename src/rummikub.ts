/**
 * The game Rummikub has 106 tiles: 8 sets numbered 1-13, colored red, blue, black, and yellow, and two (2) “wildcard” tiles.

    Write two functions:
        one that creates a new player’s tray of 14 tiles (repetitions allowed)
        and one that returns the valid sets from a given tray
        
    A set can be either 3 or 4 tiles of the same number (but all different colors), or it can be a “run” (which is three or more consecutive numbers all in the same color). The rules for Rummikub are here if you need more clarification!
 */

type Color = 'red' | 'blue' | 'black' | 'yellow';
const colors: Color[] = ['red', 'blue', 'black', 'yellow'];
class NormalTile {
	constructor(public color: Color, public number: number) {}
}
class WildcardTile {}
type Tile = WildcardTile | NormalTile;
type TileSet = Tile[];

const numbers = new Array(13).fill(null).map((_value, index) => index + 1);
console.assert(numbers.length === 13, 'numbers 1 through 13');
console.assert(numbers[0] === 1, 'first is 1');
console.assert(numbers[numbers.length - 1] === 13, 'last is 13');

function getUniqueTiles() {
	return [
		...colors.reduce<NormalTile[]>((acc, color) => acc.concat(numbers.map((number) => new NormalTile(color, number))), []),
		new WildcardTile(),
	];
}
const allTiles = [...getUniqueTiles(), ...getUniqueTiles()];
console.assert(allTiles.length === 106, '106 tiles in total');

function generateTray(): Tile[] {
	const randomTileIndexes = generateRandomNumbers();

	return randomTileIndexes.map((index) => allTiles[index]); // FIXME: if more than one player needs a tray, this needs to keep track of the tiles that have already been dealt
}

// assert 100 trays are unique
for (let i = 0; i < 100; i++) {
	const tray = generateTray();
	const tilesWithDuplicates = tray.filter((tile: Tile, index: number): boolean => {
		const otherTiles = tray.filter((_otherTile, otherIndex) => otherIndex !== index);
		return otherTiles.some((otherTile) => otherTile === tile);
	});

	console.assert(tray.length === 14, 'should be 14 tiles');
	console.assert(tilesWithDuplicates.length === 0, 'should be no duplicate tiles', tilesWithDuplicates);
}

function getSetsFromTray(tray: Tile[]): TileSet[] {
	// TODO: determine 'number' sets
	// TODO: determine 'color' sets
	return [];
}
// TODO: assert sets are correct (how?)

function generateRandomNumbers() {
	const results: number[] = [];
	for (let i = 0; i < 14; i++) {
		let integer = getRandomTileIndex();
		while (results.includes(integer)) {
			integer = getRandomTileIndex();
		}
		results.push(integer);
	}
	return results;
}

function getRandomTileIndex() {
	return randomInteger(0, 105);
}

// source: https://stackoverflow.com/a/24152886/5475829
function randomInteger(min: number, max: number) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}
