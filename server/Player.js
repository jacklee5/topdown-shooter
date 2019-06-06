const { PLAYER_SIZE } = require("../shared/constants");
const p2 = require("p2");
class Player{
    constructor(name){
        this.name = name;
        this.roomId;
        this.x = 0;
        this.y = 0;
        this.movementSpeed = 5;

        //physics body
        this.body = new p2.Circle({
            radius: PLAYER_SIZE
        });

        //what movement keys the player is currently pressing
        this.movement;
    }
}
module.exports = Player;