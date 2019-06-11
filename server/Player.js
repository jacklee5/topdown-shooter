const { PLAYER_SIZE, WEAPONS, ANIMATIONS } = require("../shared/constants");
const p2 = require("p2");
class Player{
    constructor(name, id){
        this.name = name;
        this.roomId;
        this.game;
        this.movementSpeed = 5;
        this.id = id;
        this.rotation = 0;
        this.health = 100;
        this.weapon = WEAPONS.FISTS;

        //animation stuff
        this.animating = false;
        this.animation;
        this.animationProgress = 0;

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
    fire(){
        if(this.weapon === WEAPONS.FISTS){
            if(this.animating) return;
            let rand = Math.floor(Math.random() * 2);
            this.animating = true;
            if(rand === 0)
                this.animation = ANIMATIONS.PUNCH_LEFT;
            else
                this.animation = ANIMATIONS.PUNCH_RIGHT;
        }
    }
    leaveGame(){
        const game = this.game;
        const players = game.players;
        for(let i = 0; i < players.length; i++){
            if(players[i].id === this.id){
                return players.splice(i, 1);
            }
        }
    }
    toObject(){
        return {
            health: this.health,
            name: this.name,
            x: this.x,
            y: this.y,
            rotation: this.rotation,
            id: this.id,
            weapon: this.weapon,
            animating: this.animating,
            animationProgress: this.animationProgress,
            animation: this.animation
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