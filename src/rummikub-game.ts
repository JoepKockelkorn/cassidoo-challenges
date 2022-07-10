import { createMachine } from 'xstate';

const rummikub =
	/** @xstate-layout N4IgpgJg5mDOIC5QCUCuBbdBLA1qgRgHQDuAhlgC5YB2UABAGYD2ATnQA4A2pAnmC7Dql0TVNQp0IYAMZZYWJtQDEXXvyEixEqbKkREodk3lVFBkAA9EAWgAcARluEAbAGZbABlcBWAEwAWAE5Ar1cAGhAeG19Xe0J-D2c-QIB2Z0Dfey9fAF8ciLRMXAJCGg5uPjYKVBZqEnIqWkZWIWlTZQgWUmI6ajAeqk4wRhYmdA4mJk5zIxMFanMrBEdCDxT7byT7Hwc-Nwio5dsnfxTA2297Ddtz-2c8goxsPCIy1Uq6atr6yhp6ZjYpDa8yUFU+WCGIzGny6h0Mxl+ZiQlhsFw8qy2KW8QUCfjWB0QznWhGOrlxKUyaxSDxAhWeJTeFXUXzqZF+TQBrXaSnQpGoWHYqG4FGG+CYpBY+mRs0RC2RSzs3lchF8KQ8ARu7mc-n83gJCFcSRV7lcHjuG0NV1cNLpxVe1HKaiqNVZDT+zUBwMUSjA1AgnxdMwR7UWNm2TjNtn8vm8wS8aRStn1p2chG8l3szl8gTciV893ytKedtKDvezJdP0a-xaQO5YNgYAoggYo3GYolUvhcyRoAVFxShCujh1GVVHnsvn1jhOZwuV28NyjWZtxZepcdHxZVfdnLrIOkQwldAAVkwcPwgz25X2bKdvIRXL5Ehkic4PMcUvqLqmzf4ySkurrP4FyrkU66Mk6Aa1EoFiwBQpAioQpAMCKLAABTvh42EAJRKLaEFlkyzq1Fesqhgg1jRoO0a4tm+YhIB-j6tYsSzh+mYJrsth5IW1BMFI8DIgRJRstWHqbvwgjCKI4iSDIcjzGRIbyqixJEvYIS2GqlyjixT7+IQqSnJpWSZJm2pgfSRBQMIwy+noylKapCDRnEviUrqOaJKaSr6QERmAesgRmVcRJWSWkFbpWYm7rWXo3iAMoqbelGmqmlyZDqhoJB+AT6jshApK4-4ZP+QQ+PYEWEZJJGJclzmpXYDhDlcUZBB5aqTvq2pph4i62O+JUvum1UEE5vYopRIQPsO7Vjl1U6RDYAFGUksZZVGpm8TkQA */
	createMachine(
		{
			initial: 'waiting for players amount decision',
			states: {
				'waiting for players amount decision': {
					on: {
						'player amount decided': {
							actions: ['generateTrays', 'pickStartingPlayer'],
							cond: 'amount <= 4',
							target: 'in player turn',
						},
					},
				},
				'game ended': {
					type: 'final',
				},
				'in player turn': {
					exit: 'incrementPlayer',
					initial: 'waiting for action',
					after: {
						'60000': [
							{
								cond: 'board is valid and game not ended',
							},
							{
								actions: 'penalizePlayer',
								cond: 'board is invalid and game not ended',
							},
							{
								target: 'game ended',
							},
						],
					},
					states: {
						'waiting for action': {
							on: {
								'draw new tile from pool': [
									{
										actions: 'moveTileFromPoolToTray',
										cond: 'pool has tiles and no tiles laid on board',
										target: '#Rummikub.in player turn',
									},
									{
										target: '#Rummikub.game ended',
									},
								],
								'lay tile from tray': {
									actions: 'moveTileFromTrayToBoard',
									cond: 'player is already on board and tile can be laid',
								},
								'manipulate board': {
									actions: 'moveTilesFromTrayToBoard',
									cond: 'player is already on board',
								},
								'end turn': [
									{
										cond: 'board is valid and game not ended',
										target: '#Rummikub.in player turn',
									},
									{
										actions: 'penalizePlayer',
										cond: 'board is invalid and game not ended',
										target: '#Rummikub.in player turn',
									},
									{
										target: '#Rummikub.game ended',
									},
								],
								'lay sets from board': {
									actions: 'moveTilesFromTrayToBoard',
									cond: 'player was not yet on board and sets have sufficient points',
								},
								'clear joker': {
									actions: 'switchTileFromTrayWithJoker',
									cond: 'player is already on board and joker is on board and switchable',
								},
							},
						},
					},
				},
			},
			id: 'Rummikub',
		},
		{
			guards: {
				'pool has tiles': () => true,
				'amount <= 4': () => true,
				'player is already on board': () => true,
				'player was not yet on board and sets have sufficient points': () => true,
				'board is valid and game not ended': () => true,
				'board is invalid and game not ended': () => true,
			},
			actions: {
				penalizePlayer: (context, event) => {},
				generateTrays: (context, event) => {},
				updateTray: (context, event) => {},
				incrementPlayer: (context, event) => {},
				pickStartingPlayer: (context, event) => {},
			},
		}
	);
