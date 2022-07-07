import lodash from 'lodash';
import 'lodash.combinations';
const { combinations, groupBy, last, uniqBy, sortBy } = lodash;
import chalk from 'chalk';

/**
 * The game Rummikub has 106 tiles: 8 sets numbered 1-13, colored red, blue, black, and yellow, and two (2) “wildcard” tiles.

    Write two functions:
        one that creates a new player’s tray of 14 tiles (repetitions allowed)
        and one that returns the valid sets from a given tray
        
    A set can be either 3 or 4 tiles of the same number (but all different colors), or it can be a “run” (which is three or more consecutive numbers all in the same color). The rules for Rummikub are here if you need more clarification!
 */

type Joker = '☺︎' | '☻';
type Color = 'red' | 'blue' | 'black' | 'yellow';
const colors: Color[] = ['red', 'blue', 'black', 'yellow'];

class NormalTile {
	constructor(public color: Color, public number: number) {}
}
class WildcardTile {
	constructor(public joker: Joker = '☻') {}
}
type Tile = WildcardTile | NormalTile;
type TileSet = Tile[];

const numbers = new Array(13).fill(null).map((_value, index) => index + 1);
console.assert(numbers.length === 13, 'numbers 1 through 13');
console.assert(numbers[0] === 1, 'first is 1');
console.assert(last(numbers) === 13, 'last is 13');

function getUniqueTiles(joker: Joker) {
	return [
		...colors.reduce<NormalTile[]>((acc, color) => acc.concat(numbers.map((number) => new NormalTile(color, number))), []),
		new WildcardTile(joker),
	];
}
const allTiles = [...getUniqueTiles('☺︎'), ...getUniqueTiles('☻')];
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

const interations = 5;
for (let i = 0; i < interations; i++) {
	const tray = generateTray();
	logTray(tray);
	const sets = getSetsFromTray(tray);
	logSets(sets);
	if (i < interations - 1) {
		console.log('\n---------\n');
	}
	// TODO: assert sets are correct (how?)
}

function logTray(tray: Tile[]) {
	console.log(`Tray:`);
	const sortedByNumber = sortBy(tray, (t) => (t instanceof WildcardTile ? 0 : t.number));
	// console.log(sortedByNumber.map(prettifyTile).join(' '), `(sort by ${chalk.underline('number')})`);
	const sortedByColor = sortBy(sortedByNumber, (t) => (t instanceof WildcardTile ? 0 : colors.indexOf(t.color)));
	console.log(sortedByColor.map(prettifyTile).join(' '), `(sort by ${chalk.underline('color')} then ${chalk.underline('number')})`);
}

function logSets(sets: TileSet[]) {
	const tiles = sets.map((set) => set.map(prettifyTile).join(' '));
	if (sets.length) console.log(`Sets:\n${tiles.join('\n')}`);
	else console.log('Sets: -');
}

function prettifyTile(tile: Tile): string {
	return tile instanceof WildcardTile
		? chalk.bgWhite.underline.black(`  ${tile.joker} `)
		: chalk.bgWhite[tile.color].bold.underline(` ${tile.number <= 9 ? ' ' : ''}${tile.number} `);
}

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
