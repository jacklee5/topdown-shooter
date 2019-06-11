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

        //the player object of the shooter
        this.origin = origin;
        this.lifespan = 240;
    }
    update(){
        this.x += Math.cos(this.rotation) * this.speed;
        this.y += Math.sin(this.rotation) * this.speed;
        for(let i = 0; i < this.game.players.length; i++){
            const player = this.game.players[i];
            if(player.id === this.origin.id) continue;
            if(dist(player.x, player.y, this.x, this.y) < (PLAYER_SIZE + BULLET_SIZE)){
                player.health -= this.damage;
                if(player.health < 0){
                    this.origin.kill(player);
                }
                this.destroy();
            }
        }
        this.lifespan--;
        if(this.lifespan === 0)
            this.destroy();
    }
    destroy(){
        const bullets = this.game.bullets;
        for(let i = bullets.length - 1; i >= 0; i--){
            if(bullets[i] === this){
                bullets.splice(i, 1);
            }
        }
    }
    toObject(){
        return {
            x: this.x,
            y: this.y,
            rotation: this.rotation,
        }
    }
}
module.exports = Bullet;