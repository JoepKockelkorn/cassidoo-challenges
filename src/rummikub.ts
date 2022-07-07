import lodash from 'lodash';
import 'lodash.combinations';
const { combinations, groupBy, last, uniqBy } = lodash;

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
console.assert(last(numbers) === 13, 'last is 13');

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
	// TODO: determine 'color' sets
	const normalTiles = tray.filter((tile) => !(tile instanceof WildcardTile)) as NormalTile[];
	const wildCardTiles = tray.filter((tile) => tile instanceof WildcardTile) as WildcardTile[];
	const groupedByNumber = groupBy(normalTiles, 'number') as Partial<Record<number, Tile[]>>;
	const colorSets = Object.values(groupedByNumber).reduce<TileSet[]>((acc, tiles) => {
		const uniqueTiles = uniqBy(tiles, 'color');
		const tilesToCombine = [...uniqueTiles, ...wildCardTiles];
		if (tilesToCombine.length <= 2) {
			return acc;
		}
		const combinationsWithThree = combinations(tilesToCombine, 3);
		const combinationsWithFour = combinations(tilesToCombine, 4);

		return [...acc, ...combinationsWithThree, ...combinationsWithFour];
	}, []);

	// TODO: determine 'number' sets
	return colorSets;
}
const tray: Tile[] = [
	new NormalTile('black', 1),
	new NormalTile('blue', 1),
	new NormalTile('red', 1),
	new NormalTile('yellow', 1),
	new NormalTile('black', 2),
	new NormalTile('blue', 2),
	new NormalTile('red', 2),
	new NormalTile('black', 3),
	new NormalTile('blue', 3),
	new NormalTile('blue', 4),
];
console.log(getSetsFromTray(tray));
console.log('---------');
console.log(getSetsFromTray([...tray, new WildcardTile()]));
console.log('---------');
console.log(getSetsFromTray([...tray, new WildcardTile(), new WildcardTile()]));

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
