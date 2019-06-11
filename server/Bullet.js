const { BULLET_SIZE, PLAYER_SIZE, WEAPONS } = require("../shared/constants")
const dist = (x1, y1, x2, y2) => {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}
class Bullet{
    constructor(x, y, rotation, weapon, game, origin){
        this.x = x;
        this.y = y;
        this.rotation = rotation;
        this.speed = WEAPONS[weapon].speed;
        this.game = game;
        this.damage = WEAPONS[weapon].damage;
        this.exists = true;
        this.origin = origin;
        this.lifespan = 90;
    }
    update(){
        this.x += Math.cos(this.rotation) * this.speed;
        this.y += Math.sin(this.rotation) * this.speed;
        for(let i = 0; i < this.game.players.length; i++){
            const player = this.game.players[i];
            if(player.id === this.origin) continue;
            if(this.exists && dist(player.x, player.y, this.x, this.y) < (PLAYER_SIZE + BULLET_SIZE)){
                player.health -= this.damage;
                this.destroy();
            }
        }
    }
    destroy(){
        this.exists = false;
        const bullets = this.game.bullets;
        for(let i = 0; i < bullets.length; i++){
            if(bullets[i] === this){
                console.log(i);
            }
        }
    }
    toObject(){
        return {
            x: this.x,
            y: this.y,
            rotation: this.rotation,
            exists: this.exists
        }
    }
}
module.exports = Bullet;