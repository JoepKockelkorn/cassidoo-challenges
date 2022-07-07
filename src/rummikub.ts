import lodash, { reduce } from 'lodash';
import 'lodash.combinations';
const { maxBy, combinations, groupBy, last, uniqBy, sortBy, padStart } = lodash;
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
interface Sets {
	groups: TileSet[];
	runs: TileSet[];
}

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

function generateTray(playerAmount = 4 | 5 | 6): Tile[] {
	if (playerAmount === 5 || playerAmount === 6) throw new Error('Only 4 players currently supported');
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

function getSetsFromTray(tray: Tile[]): Sets {
	const normalTiles = tray.filter((tile) => !(tile instanceof WildcardTile)) as NormalTile[];
	const wildcardTiles = tray.filter((tile) => tile instanceof WildcardTile) as WildcardTile[];
	const groups = getGroups(normalTiles, wildcardTiles);
	const runs = getRuns(normalTiles, wildcardTiles);

	return { groups, runs };
}

const interations = 10;
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

// const tray = [
// 	new NormalTile('black', 1),
// 	new NormalTile('black', 2),
// 	new NormalTile('black', 3),
// 	new NormalTile('black', 4),
// 	new NormalTile('black', 6),
// 	new NormalTile('black', 7),
// 	new NormalTile('black', 12),
// 	new NormalTile('black', 13),
// 	new WildcardTile('☺︎'),
// 	new WildcardTile('☻'),
// ];
// logTray(tray);
// const sets = getSetsFromTray(tray);
// logSets(sets);

function getRuns(normalTiles: NormalTile[], wildcardTiles: WildcardTile[]) {
	const groupedByColor = groupBy(normalTiles, 'color');
	return uniqBy(
		Object.values(groupedByColor).reduce<TileSet[]>((acc, curr) => [...acc, ...getRunsOfColor(curr, wildcardTiles)], []),
		(val) => val.map((v) => JSON.stringify(v)).join('')
	);
}

function getRunsOfColor(normalTiles: NormalTile[], wildcardTiles: WildcardTile[]) {
	// sequences can only be between 1 and 13 (both included)
	const totalTiles = normalTiles.length + wildcardTiles.length;
	const startingTilesPerNumber = numbers
		.filter((num) => num < 12 && num <= totalTiles - 2) // a sequence can never start with a 12 or 13 and when the total tiles is lower than 13 it makes no sense to start at total - 2 because a sequence must be 3 long
		.reduce<Partial<Record<number, Tile[]>>>(
			(acc, number) => ({ ...acc, [number]: [...normalTiles.filter((tile) => tile.number >= number), ...wildcardTiles] }),
			{}
		);

	const numbersWithStartingTiles = Object.entries(startingTilesPerNumber).filter(([_num, tiles]) => (tiles ?? []).length > 0);
	return numbersWithStartingTiles
		.reduce<TileSet[]>(
			(acc, [number, tiles]) => [
				...acc,
				...tiles!.flatMap((tile) => getSequencesOfRun([tile], Number(number), normalTiles, wildcardTiles)),
			],
			[]
		)
		.filter((set) => set.length >= 3);
}

function getSequencesOfRun(run: TileSet, currentNumber: number, normalTiles: NormalTile[], wildcardTiles: WildcardTile[]): TileSet[] {
	function getNextTilesForRun(currentRun: TileSet) {
		const lastTile = currentRun[currentRun.length - 1];
		const highestNormalTile = maxBy(currentRun.filter(isNormalTile), (t) => t.number);
		const indexOfHighestNormalTile = highestNormalTile ? currentRun.indexOf(highestNormalTile) : -1;
		const remainingTiles = currentRun.slice(indexOfHighestNormalTile + 1);
		const amountOfWildcardTilesAfterNormalTiles = highestNormalTile === undefined ? 0 : remainingTiles.filter(isWildcardTile).length;
		const currentHighestNumber = highestNormalTile ? highestNormalTile?.number + amountOfWildcardTilesAfterNormalTiles : 0;
		if (highestNormalTile?.number === 13 || currentRun.length >= 13) return [];

		const nextNormalTiles = normalTiles.filter((t) => currentHighestNumber === 0 || t.number === currentHighestNumber + 1);
		const nextWildcardTiles = wildcardTiles.filter((t) => !currentRun.includes(t));

		return [...nextNormalTiles, ...nextWildcardTiles];
	}

	const nextTiles = getNextTilesForRun(run);
	const newRuns = nextTiles.map((tile) => [...run, tile]);

	return newRuns.reduce<TileSet[]>(
		(acc, curr) => [...acc, ...getSequencesOfRun(curr, currentNumber + 1, normalTiles, wildcardTiles)],
		newRuns
	);
}

function isNormalTile(t: Tile): t is NormalTile {
	return t instanceof NormalTile;
}

function isWildcardTile(t: Tile): t is WildcardTile {
	return t instanceof WildcardTile;
}

function getGroups(normalTiles: NormalTile[], wildcardTiles: WildcardTile[]) {
	const groupedByNumber = groupBy(normalTiles, 'number');
	return Object.values(groupedByNumber).reduce<TileSet[]>((acc, tiles) => {
		const uniqueTiles = uniqBy(tiles, 'color');
		const tilesToCombine = [...uniqueTiles, ...wildcardTiles];
		if (tilesToCombine.length <= 2) {
			return acc;
		}
		const combinationsWithThree = combinations(tilesToCombine, 3);
		const combinationsWithFour = combinations(tilesToCombine, 4);

		return [...acc, ...combinationsWithThree, ...combinationsWithFour];
	}, []);
}

function logTray(tray: Tile[]) {
	console.log(`Tray:`);
	const sortedByNumber = sortBy(tray, (t) => (t instanceof WildcardTile ? 0 : t.number));
	// console.log(sortedByNumber.map(prettifyTile).join(' '), `(sort by ${chalk.underline('number')})`);
	const sortedByColor = sortBy(sortedByNumber, (t) => (t instanceof WildcardTile ? 0 : colors.indexOf(t.color)));
	console.log(sortedByColor.map(prettifyTile).join(' '), `(sort by ${chalk.underline('color')} then ${chalk.underline('number')})`);
}

function logSets({ groups, runs }: Sets) {
	const groupTiles = groups.map((set) => set.map(prettifyTile).join(' '));
	const runTiles = runs.map((set) => set.map(prettifyTile).join(' '));
	if (groupTiles.length) console.log(`Groups (${groupTiles.length}):\n${groupTiles.join('\n')}`);
	if (runTiles.length) console.log(`Runs (${runTiles.length}):\n${runTiles.join('\n')}`);
	if (groupTiles.length === 0 && runTiles.length === 0) console.log('No sets found 😭');
}

function prettifyTile(tile: Tile): string {
	return tile instanceof WildcardTile
		? chalk.bgWhite.underline.black(`  ${tile.joker} `)
		: chalk.bgWhite[tile.color].bold.underline(` ${padStart(`${tile.number}`, 2, ' ')} `);
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
