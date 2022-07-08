import chalk from 'chalk';
import lodash from 'lodash';
import 'lodash.combinations';
const { maxBy, combinations, groupBy, last, uniqBy, sortBy, padStart } = lodash;

/**
 * The game Rummikub has 106 tiles: 8 sets numbered 1-13, colored red, blue, black, and yellow, and two (2) “wildcard” tiles.

    Write two functions:
        one that creates a new player’s tray of 14 tiles (repetitions allowed)
        and one that returns the valid sets from a given tray
        
    A set can be either 3 or 4 tiles of the same number (but all different colors), or it can be a “run” (which is three or more consecutive numbers all in the same color). The rules for Rummikub are here if you need more clarification!
 */

export type Joker = '☺︎' | '☻';
export const colors = ['red', 'cyan', 'black', 'yellow'] as const;
export type Color = typeof colors[number];

// EXPERIMENTAL TYPES
// export type RummiNum = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11' | '12' | '13';
// type FlatTile = `${Color}|${RummiNum}` | Joker;
// const cyanOne: FlatTile = 'cyan|1';
// const joker: FlatTile = '☺︎';
// const test: FlatTile  = '';

export class NormalTile {
	constructor(public color: Color, public number: number) {}
	toString() {
		return chalk.bgWhite[this.color].bold.underline(` ${padStart(`${this.number}`, 2, ' ')} `);
	}
}
export class WildcardTile {
	constructor(public joker: Joker = '☻') {}
	toString() {
		return chalk.bgWhite.underline.black(`  ${this.joker} `);
	}
}
export type Tile = WildcardTile | NormalTile;
export type TileSet = Tile[];
export interface Sets {
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

export function generateTray(playerAmount = 4 | 5 | 6): TileSet {
	if (playerAmount === 5 || playerAmount === 6) throw new Error('Only 4 players currently supported');
	const randomTileIndexes = generateRandomNumbers();

	return randomTileIndexes.map((index) => allTiles[index]); // FIXME: if more than one player needs a tray, this needs to keep track of the tiles that have already been dealt
}

export function getSetsFromTray(tray: TileSet): Sets {
	const normalTiles = tray.filter((tile) => !(tile instanceof WildcardTile)) as NormalTile[];
	const wildcardTiles = tray.filter((tile) => tile instanceof WildcardTile) as WildcardTile[];
	const groups = getGroups(normalTiles, wildcardTiles);
	const runs = getRuns(normalTiles, wildcardTiles);

	return { groups, runs };
}

function getRuns(normalTiles: NormalTile[], wildcardTiles: WildcardTile[]) {
	const groupedByColor = groupBy(normalTiles, 'color');
	return Object.values(groupedByColor).reduce<TileSet[]>((acc, curr) => [...acc, ...getRunsOfColor(curr, wildcardTiles)], []);
}

function getRunsOfColor(normalTiles: NormalTile[], wildcardTiles: WildcardTile[]) {
	const sortedNormalTiles = uniqBy(sortBy(normalTiles, 'number'), 'number');
	const totalTiles = sortedNormalTiles.length + wildcardTiles.length;
	// a sequence can never start with a 12 or 13, and
	// when there are only 3 tiles (1, 2, 3) than it makes no sense to start with anything higher than 1
	const startingNormalTiles = sortedNormalTiles.filter((tile) => tile.number <= 11 && sortedNormalTiles.indexOf(tile) < totalTiles - 2);
	const startingTiles = [...startingNormalTiles, ...wildcardTiles];
	const completedRuns = startingTiles.flatMap((tile) => getSequencesOfRun([tile], sortedNormalTiles, wildcardTiles));
	const validRunsByLength = completedRuns.filter((set) => set.length >= 3);
	return uniqBy(validRunsByLength, hashSet); // filter out the duplicate runs (i.e. 1 2 3) when a player has a 1, a 2 and two 3s
}

function hashSet(set: TileSet): string {
	return set.map((tile) => (isNormalTile(tile) ? `${tile.color}${tile.number}` : tile.joker)).join(', ');
}

function getSequencesOfRun(run: TileSet, normalTiles: NormalTile[], wildcardTiles: WildcardTile[]): TileSet[] {
	function getNextTilesForRun(currentRun: TileSet) {
		const lastTile = currentRun[currentRun.length - 1];
		const highestNormalTile = maxBy(currentRun.filter(isNormalTile), (t) => t.number);
		const indexOfHighestNormalTile = highestNormalTile ? currentRun.indexOf(highestNormalTile) : -1;
		const remainingTiles = currentRun.slice(indexOfHighestNormalTile + 1);
		const wildcardTilesAfterNormalTiles = highestNormalTile === undefined ? [] : remainingTiles.filter(isWildcardTile);
		const currentHighestNumber = highestNormalTile
			? highestNormalTile?.number + wildcardTilesAfterNormalTiles.length
			: currentRun.filter(isWildcardTile).length;
		if (highestNormalTile?.number === 13 || currentRun.length >= 13) return [];

		const nextNormalTiles = normalTiles.filter(
			(t) =>
				currentHighestNumber === 0 ||
				(lastTile === highestNormalTile && t.number === currentHighestNumber + 1) ||
				(highestNormalTile === undefined && t.number > currentHighestNumber)
		);
		const nextWildcardTiles = wildcardTiles.filter((t) => !currentRun.includes(t));

		return [...nextNormalTiles, ...nextWildcardTiles];
	}

	const nextTiles = getNextTilesForRun(run);
	const newRuns = nextTiles.map((tile) => [...run, tile]);

	return newRuns.reduce<TileSet[]>((acc, curr) => [...acc, ...getSequencesOfRun(curr, normalTiles, wildcardTiles)], newRuns);
}

export function isNormalTile(t: Tile): t is NormalTile {
	return t instanceof NormalTile;
}

export function isWildcardTile(t: Tile): t is WildcardTile {
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

export function logTray(tray: TileSet) {
	console.log(`Tray:`);
	const sortedByNumber = sortBy(tray, (t) => (t instanceof WildcardTile ? 0 : t.number));
	// console.log(formatSet(sortedByNumber), `(sort by ${chalk.underline('number')})`);
	const sortedByColor = sortBy(sortedByNumber, (t) => (t instanceof WildcardTile ? 0 : colors.indexOf(t.color)));
	console.log(formatSet(sortedByColor), `(sort by ${chalk.underline('color')} then ${chalk.underline('number')})`);
}

export function logSets({ groups, runs }: Sets) {
	const groupTiles = groups.map(formatSet);
	const runTiles = runs.map(formatSet);
	if (groupTiles.length) console.log(`Groups (${groupTiles.length}):\n${groupTiles.join('\n')}`);
	if (runTiles.length) console.log(`Runs (${runTiles.length}):\n${runTiles.join('\n')}`);
	if (groupTiles.length === 0 && runTiles.length === 0) console.log('No sets found 😭');
}

function formatSet(set: TileSet) {
	return set.join(' ');
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

// const tray = generateTray();
// logTray(tray);
// const sets = getSetsFromTray(tray);
// logSets(sets);
