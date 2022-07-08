import { groupBy } from 'lodash';
import { generateTray, getSetsFromTray, isNormalTile, isWildcardTile, NormalTile, Tile, TileSet, WildcardTile } from './rummikub';

expect.extend({
	toContainSet(received: TileSet[], expected: TileSet) {
		const pass =
			received.find((set) => set.length === expected.length && set.every((tile, index) => expected[index] === tile)) !== undefined;
		return pass
			? { message: () => `expected\n\t${received.join('\n\t')} not to contain set ${expected}`, pass: true }
			: { message: () => `expected\n\t${received.join('\n\t')} to contain set ${expected}`, pass: false };
	},
});

interface CustomMatchers<R = unknown> {
	toContainSet(set: TileSet): R;
}

declare global {
	namespace jest {
		interface Expect extends CustomMatchers {}
		interface Matchers<R> extends CustomMatchers<R> {}
		interface InverseAsymmetricMatchers extends CustomMatchers {}
	}
}

describe('rummikub', () => {
	describe('generateTray', () => {
		let trays: TileSet[];
		beforeEach(() => {
			trays = new Array(100).fill(null).map(generateTray);
		});

		test('should be of length 14', () => {
			trays.forEach((tray) => {
				expect(tray).toHaveLength(14);
			});
		});

		test('no number, color combination can exist three times', () => {
			trays.forEach((tray) => {
				const groupedByColorAndNumber = groupBy(tray.filter(isNormalTile), (tile) => tile.toString());

				Object.entries(groupedByColorAndNumber).forEach(([, tiles]) => expect(tiles.length).toBeLessThanOrEqual(2));
			});
		});

		test('only two wildcards allowed', () => {
			trays.forEach((tray) => {
				const wildcards = tray.filter(isWildcardTile);

				expect(wildcards.length).toBeLessThanOrEqual(2);
			});
		});

		test('no tile is the same by reference', () => {
			trays.forEach((tray) => {
				const duplicates = tray.filter((tile: Tile, index: number): boolean => {
					const otherTiles = tray.filter((_otherTile, otherIndex) => otherIndex !== index);
					return otherTiles.some((otherTile) => otherTile === tile);
				});

				expect(duplicates).toHaveLength(0);
			});
		});
	});

	describe('getSetsFromTray', () => {
		describe('groups', () => {
			test('a group has length 3 or 4', () => {
				const tray = [
					new NormalTile('cyan', 1),
					new NormalTile('yellow', 1),
					new NormalTile('black', 1),
					new NormalTile('red', 1),
					new WildcardTile('☺︎'),
					new WildcardTile('☻'),
				];
				const sets = getSetsFromTray(tray);
				expect(sets.groups.every((group) => group.length === 3 || group.length === 4)).toEqual(true);
			});

			test('should handle duplicates', () => {
				const tray = [new NormalTile('cyan', 1), new NormalTile('yellow', 1), new NormalTile('red', 1), new NormalTile('red', 1)];
				const sets = getSetsFromTray(tray);
				expect(sets.groups).toHaveLength(1);
			});

			test('groups are about the same number', () => {
				const tray = [new NormalTile('cyan', 2), new NormalTile('black', 1), new NormalTile('red', 1)];
				const sets = getSetsFromTray(tray);
				expect(sets.groups).toHaveLength(0);
			});

			test('when short in numbers, wildcards can make it work', () => {
				const tray = [new NormalTile('cyan', 1), new NormalTile('black', 1), new WildcardTile('☺︎')];
				const sets = getSetsFromTray(tray);
				expect(sets.groups).toHaveLength(1);
			});
		});

		describe('runs', () => {
			test('a run has length 3 or more', () => {
				const tray = [new NormalTile('cyan', 1), new NormalTile('cyan', 2)];
				const sets = getSetsFromTray(tray);
				expect(sets.runs).toHaveLength(0);
			});

			test('a run is only in one color', () => {
				const tray = [new NormalTile('cyan', 1), new NormalTile('cyan', 2), new NormalTile('yellow', 3)];
				const sets = getSetsFromTray(tray);
				expect(sets.runs).toHaveLength(0);
			});

			test('the most basic run', () => {
				const tray = [new NormalTile('cyan', 1), new NormalTile('cyan', 2), new NormalTile('cyan', 3)];
				const sets = getSetsFromTray(tray);
				expect(sets.runs).toHaveLength(1);
				expect(sets.runs).toContainSet([...tray]);
			});

			test('nothing comes before 1', () => {
				const one = new NormalTile('yellow', 1);
				const two = new NormalTile('yellow', 2);
				const joker1 = new WildcardTile('☺︎');
				const tray = [one, joker1, two];
				const sets = getSetsFromTray(tray);
				expect(sets.runs).not.toContainSet([joker1, one, two]);
				expect(sets.runs).toHaveLength(1);
			});

			test('nothing comes after 13', () => {
				const eleven = new NormalTile('cyan', 11);
				const twelve = new NormalTile('cyan', 12);
				const thirteen = new NormalTile('cyan', 13);
				const joker1 = new WildcardTile('☺︎');
				const tray = [eleven, twelve, thirteen, joker1];
				const sets = getSetsFromTray(tray);
				expect(sets.runs).not.toContainSet([eleven, twelve, thirteen, joker1]);
			});

			test('after only wildcards, anything is okay', () => {
				const three = new NormalTile('red', 3);
				const joker1 = new WildcardTile('☺︎');
				const joker2 = new WildcardTile('☻');
				const tray = [three, joker1, joker2];
				const sets = getSetsFromTray(tray);
				expect(sets.runs).toContainSet([joker1, three, joker2]);
				expect(sets.runs).toHaveLength(3 * 2 * 1); // 3!
			});

			test('a wildcard replaces a number', () => {
				const one = new NormalTile('cyan', 1);
				const two = new NormalTile('cyan', 2);
				const three = new NormalTile('cyan', 3);
				const joker1 = new WildcardTile('☺︎');
				const tray = [one, two, three, joker1];
				const sets = getSetsFromTray(tray);
				expect(sets.runs).not.toContainSet([one, two, joker1, three]);
			});

			test('no duplicates allowed', () => {
				const one = new NormalTile('cyan', 1);
				const two = new NormalTile('cyan', 2);
				const three = new NormalTile('cyan', 3);
				const duplicate = new NormalTile('cyan', 3);
				const tray = [one, two, three, duplicate];
				const sets = getSetsFromTray(tray);
				expect(sets.runs).not.toContainSet([one, two, duplicate]);
				expect(sets.runs).toContainSet([one, two, three]);
			});

			test('runs can be short and long', () => {
				const one = new NormalTile('cyan', 1);
				const two = new NormalTile('cyan', 2);
				const three = new NormalTile('cyan', 3);
				const four = new NormalTile('cyan', 4);
				const tray = [one, two, three, four];
				const sets = getSetsFromTray(tray);
				expect(sets.runs).toContainSet([one, two, three]);
				expect(sets.runs).toContainSet([one, two, three, four]);
			});
		});
	});
});
