const { ANIMATIONS, PLAYER_SIZE, HAND_ANGLE, WEAPONS, FIST_REACH, HAND_SIZE } = require("../shared/constants.js");
const p2 = require("p2");
const ROOT2 = Math.sqrt(2);
const dist = (x1, y1, x2, y2) => {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}
const Bullet = require("./Bullet");
class Player{
    constructor(name, id){
        this.name = name;
        this.roomId;
        this.game;
        this.movementSpeed = 25;
        this.id = id;
        this.rotation = 0;
        this.health = 100;
        this.weapon = WEAPONS.AR;
        this.isPunching = false;
        this.socket;
        this.attackCooldown = 0;
        this.mouseDown = false;

        //animation stuff
        this.animating = false;
        this.animation = 0;
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
        this.mouseDown = true;
        if(this.weapon === WEAPONS.FISTS){
            if(this.animating) return;
            let rand = Math.floor(Math.random() * 2);
            this.animating = true;
            this.isPunching = true;
            if(rand === 0)
                this.animation = ANIMATIONS.PUNCH_LEFT;
            else
                this.animation = ANIMATIONS.PUNCH_RIGHT;
        }else if(this.attackCooldown === 0){
            this.game.bullets.push(new Bullet(this.x, this.y, this.rotation - Math.PI / 2, this.weapon, this.game, this.id));
            this.attackCooldown = WEAPONS[this.weapon].cooldown;
        }
    }
    release(){
        this.mouseDown = false;
    }
    update(){
        //movement
        let movementSpeed = this.movementSpeed;
        this.body.velocity = [0, 0];
        if((this.movement.up || this.movement.down) && (this.movement.left || this.movement.right))
            movementSpeed /= ROOT2
        if(this.movement.up)
            this.body.velocity[1] = -movementSpeed;
        if(this.movement.down)
            this.body.velocity[1] = movementSpeed;
        if(this.movement.left)
            this.body.velocity[0] = -movementSpeed;
        if(this.movement.right)
            this.body.velocity[0] = movementSpeed;

        //animations
        if(this.animating){
            if(ANIMATIONS[this.animation].length > this.animationProgress)
                this.animationProgress++;
            else{
                this.animationProgress = 0;
                this.animating = false;
                this.isPunching = false;
            }
        }

        //apply punch collisions
        if(this.isPunching){
            const HAND_X = Math.cos(HAND_ANGLE) * PLAYER_SIZE;
            const HAND_Y = -Math.sin(HAND_ANGLE) * PLAYER_SIZE;
            let rightX = HAND_X, rightY = HAND_Y, leftX = -HAND_X, leftY = HAND_Y;
            let x;
            let y;
            if(this.animation === ANIMATIONS.PUNCH_LEFT){
                const length = ANIMATIONS[this.animation].length;
                x = leftX + Math.sin(this.animationProgress * Math.PI / length) * FIST_REACH;
                y = leftY - Math.sin(this.animationProgress * Math.PI / length) * FIST_REACH;
            }if(this.animation === ANIMATIONS.PUNCH_RIGHT){
                const length = ANIMATIONS[this.animation].length;
                x = rightX - Math.sin(this.animationProgress * Math.PI / length) * FIST_REACH;
                y = rightY - Math.sin(this.animationProgress * Math.PI / length) * FIST_REACH;
            }
            x = Math.cos(this.rotation) * (x) - Math.sin(this.rotation) * (y);
            y = Math.sin(this.rotation) * (x) + Math.cos(this.rotation) * (y);
            x += this.x;
            y += this.y;
            for(let i = 0; i < this.game.players.length; i++){
                const player = this.game.players[i];
                if(player.id === this.id) continue;
                if(dist(x, y, player.x, player.y) < PLAYER_SIZE + HAND_SIZE){
                    player.health -= WEAPONS[this.weapon].damage;
                    this.isPunching = false;
                    if(player.health < 0){
                        player.socket.emit("death");
                    }
                }
            }
        }

        if(this.attackCooldown > 0)
            this.attackCooldown--;
        if(WEAPONS[this.weapon].auto && this.attackCooldown === 0)
            this.fire();
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