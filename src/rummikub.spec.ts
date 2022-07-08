import { generateTray, getSetsFromTray, logSets, logTray, NormalTile, Tile } from './rummikub';

describe('rummikub', () => {
	describe('generateTray', () => {
		it('should work', () => {
			// assert 100 trays are unique
			for (let i = 0; i < 100; i++) {
				const tray = generateTray();
				const tilesWithDuplicates = tray.filter((tile: Tile, index: number): boolean => {
					const otherTiles = tray.filter((_otherTile, otherIndex) => otherIndex !== index);
					return otherTiles.some((otherTile) => otherTile === tile);
				});

				expect(tray.length).toBe(14);
				expect(tilesWithDuplicates.length).toBe(0); // should be no duplicate tiles
			}
		});
	});

	describe('getSetsFromTray', () => {
		describe('groups', () => {
			test.todo('should handle duplicates');
			test.todo('groups of 3 or 4 for every color');
			test.todo('when a group of 2 it should work with a wildcard');
		});
		describe('runs', () => {
			test.todo('should handle duplicates');

			test('a basic run [123]', () => {
				const tray = [new NormalTile('black', 1), new NormalTile('black', 2), new NormalTile('black', 3)];
				const sets = getSetsFromTray(tray);
				expect(sets.runs).toHaveLength(1);
			});
		});
		it.skip('should work', () => {
			const iterations = 100;
			for (let i = 0; i < iterations; i++) {
				const tray = generateTray();
				logTray(tray);
				const sets = getSetsFromTray(tray);
				logSets(sets);
				if (i < iterations - 1) {
					console.log('\n---------\n');
				}
				// TODO: assert sets are correct (how?)
			}
		});
	});
});
