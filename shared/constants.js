const CONSTANTS = { 
    MOVEMENT_SPEED: 200,
    PLAYER_SIZE: 15,
    MAX_TREES: 50,
	MAX_X: 1920,
	MAX_Y: 1080,
	FORESTID: 0,
	CITYID: 1,
	ICEID: 2,
    MAP_NAMES: ["Forest", "City", "Iceberg"],
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
    BULLET_DURATION: 360,
    GAME_LENGTH: 5 * 60 * 60,
    //NOTE: reload time is in seconds!
    //enum for weapons, similar to below
    WEAPONS: {
        FISTS: 0,
        0: {
            damage: 25
        },
        PISTOL: 1,
        1: {
            damage: 15,
            speed: 2000,
            cooldown: 5,
            length: 20,
            magazine: 15,
            spread: 15,
            reload: 1
        },
        AR: 2,
        2: {
            damage: 12,
            speed: 1800,
            cooldown: 5,
            auto: true,
            length: 34,
            magazine: 30,
            spread: 8,
            reload: 1
        },
        REVOLVER: 3,
        3: {
            damage: 45,
            speed: 2500,
            cooldown: 30,
            length: 20,
            color: "#636363",
            spread: 1,
            magazine: 5,
            reload: 1.5
        }
    },
    //enum for animations and the corresponding numbers encode values for the animation
    ANIMATIONS: {
        PUNCH_LEFT: 0,
        0: {
            length: 15
        },
        PUNCH_RIGHT: 1,
        1: {
            length: 15
        }
    }, 
    GAME_MODES: {
        DEATHMATCH: 0
    },
    MODE_NAMES: ["Deathmatch"],
    ROLES: {
        PLAYER: 1,
        BULLET: 2,
        BORDER: 3,
        TREE: 4
    },
}
module.exports = CONSTANTS;