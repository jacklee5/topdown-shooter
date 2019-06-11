const CONSTANTS = { 
    PLAYER_SIZE: 15,
    //radians
    HAND_ANGLE: 45 * Math.PI / 180,
    HAND_SIZE: 5,
    FIST_REACH: 15,
    BULLET_SIZE: 5,
    //enum for weapons, similar to below
    WEAPONS: {
        FISTS: 0,
        0: {
            damage: 30
        },
        PISTOL: 1,
        1: {
            damage: 15,
            speed: 3,
            cooldown: 30
        },
        AR: 2,
        2: {
            damage: 12,
            speed: 4,
            cooldown: 10,
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
}
module.exports = CONSTANTS;