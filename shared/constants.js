const CONSTANTS = { 
    PLAYER_SIZE: 15,
    MAX_TREES: 20,
	MAX_X: 1920,
	MAX_Y: 1080,
	FORESTID: 0,
	CITYID: 1,
	ROOFID: 2,
	ICEID: 3,
	HALFROAD: (1920 / 30),
	TREE: {
	    health: 100
	},

	CAR: {
	    speed: 100
	},

	SNAKE: {
	    health: 25
	},
    //radians
    HAND_ANGLE: 45 * Math.PI / 180,
    HAND_SIZE: 5,
    FIST_REACH: 15,
    BULLET_SIZE: 3,
    //enum for weapons, similar to below
    WEAPONS: {
        FISTS: 0,
        0: {
            damage: 30
        },
        PISTOL: 1,
        1: {
            damage: 15,
            speed: 5,
            cooldown: 30
        },
        AR: 2,
        2: {
            damage: 12,
            speed: 4,
            cooldown: 45,
            auto: true
        }
    },
    //enum for animations and the corresponding numbers encode values for the animation
    ANIMATIONS: {
        PUNCH_LEFT: 0,
        0: {
            length: 120
        },
        PUNCH_RIGHT: 1,
        1: {
            length: 120
        }
    }, 
    GAME_MODES: {
        DEATHMATCH: 0
    }
}
module.exports = CONSTANTS;