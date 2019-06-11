const MAX_PLAYERS = 20;
const p2 = require("p2");
const ROOT2 = Math.sqrt(2);
const { ANIMATIONS } = require("../shared/constants.js");
class Game{
    constructor(id){
        this.players = [];
        this.id = id;
        this.world = new p2.World({
            gravity: [0, 0]
        });
    }
    isJoinable(){
        return this.players.length < MAX_PLAYERS;
    }
    addPlayer(player){
        this.players.push(player);
        player.roomId = this.id;
    }
    tick(){
        //update players
        for(let i = 0; i < this.players.length; i++){
            const player = this.players[i];

            let movementSpeed = player.movementSpeed;
            player.body.velocity = [0, 0];
            if((player.movement.up || player.movement.down) && (player.movement.left || player.movement.right))
                movementSpeed *= ROOT2
            if(player.movement.up)
                player.body.velocity[1] = -movementSpeed;
            if(player.movement.down)
                player.body.velocity[1] = movementSpeed;
            if(player.movement.left)
                player.body.velocity[0] = -movementSpeed;
            if(player.movement.right)
                player.body.velocity[0] = movementSpeed;

            if(player.animating)
                if(ANIMATIONS[player.animation].length > player.animationProgress)
                    player.animationProgress++;
                else{
                    player.animationProgress = 0;
                    player.animating = false;
                }
        }
        this.world.step(1 / 60);
        
    }
    toObject(){
        const result = {};
        result.players = this.players.map(x => x.toObject());
        return result;
    }
}

module.exports = Game;