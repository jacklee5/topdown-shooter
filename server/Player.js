const { PLAYER_SIZE } = require("../shared/constants");
const p2 = require("p2");
class Player{
    constructor(name){
        this.name = name;
        this.roomId;
        this.movementSpeed = 5;

        //physics body
        this.body = new p2.Body({
            mass: 1
        });
        const shape = new p2.Circle({
            radius: PLAYER_SIZE
        });
        this.body.addShape(shape);

        //what movement keys the player is currently pressing
        this.movement = {
            up: false,
            down: false,
            left: false,
            right: false
        };
    }
    toObject(){
        return {
            name: this.name,
            x: this.x,
            y: this.y,
        }
    }
    get x(){
        return this.body.position[0];
    }
    get y(){
        return this.body.position[1];
    }
}
module.exports = Player;