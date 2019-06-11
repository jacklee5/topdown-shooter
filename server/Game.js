const MAX_PLAYERS = 20;
const p2 = require("p2");
const ROOT2 = Math.sqrt(2);
const { ANIMATIONS, PLAYER_SIZE, HAND_ANGLE, WEAPONS, FIST_REACH } = require("../shared/constants.js");
const dist = (x1, y1, x2, y2) => {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}
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
    tick(io){
        //update players
        const start = Date.now();
        for(let i = 0; i < this.players.length; i++){
            const player = this.players[i];

            //movement
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

            //animations
            if(player.animating){
                if(ANIMATIONS[player.animation].length > player.animationProgress)
                    player.animationProgress++;
                else{
                    player.animationProgress = 0;
                    player.animating = false;
                    player.isPunching = false;
                }
            }

            if(player.isPunching){
                const HAND_X = Math.cos(HAND_ANGLE) * PLAYER_SIZE;
                const HAND_Y = -Math.sin(HAND_ANGLE) * PLAYER_SIZE;
                let rightX = HAND_X, rightY = HAND_Y, leftX = -HAND_X, leftY = HAND_Y;
                let x;
                let y;
                if(player.animation === ANIMATIONS.PUNCH_LEFT){
                    const length = ANIMATIONS[player.animation].length;
                    x = leftX + Math.sin(player.animationProgress * Math.PI / length) * FIST_REACH;
                    y = leftY - Math.sin(player.animationProgress * Math.PI / length) * FIST_REACH;
                }if(player.animation === ANIMATIONS.PUNCH_RIGHT){
                    const length = ANIMATIONS[player.animation].length;
                    x = rightX - Math.sin(player.animationProgress * Math.PI / length) * FIST_REACH;
                    y = rightY - Math.sin(player.animationProgress * Math.PI / length) * FIST_REACH;
                }
                x = Math.cos(player.rotation) * (x) - Math.sin(player.rotation) * (y);
                y = Math.sin(player.rotation) * (x) + Math.cos(player.rotation) * (y);
                x += player.x;
                y += player.y;
                for(let i = 0; i < this.players.length; i++){
                    if(this.players[i].id === player.id) continue;
                    if(dist(x, y, this.players[i].x, this.players[i].y) < PLAYER_SIZE){
                        this.players[i].health -= WEAPONS[player.weapon].damage;
                        player.isPunching = false;
                    }
                }
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