const { BULLET_SIZE, WEAPONS, ROLES, BULLET_DURATION } = require("../shared/constants")
const p2 = require("p2");
const dist = (x1, y1, x2, y2) => {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}
class Bullet{
    constructor(x, y, rotation, weapon, game, origin){
        this.rotation = rotation;
        this.speed = WEAPONS[weapon].speed;
        this.game = game;
        this.damage = WEAPONS[weapon].damage;
        this.exists = true;

        this.body = new p2.Body({
            mass: 1,
            position: [x, y],
            velocity: [Math.cos(this.rotation) * this.speed, Math.sin(this.rotation) * this.speed]
        })
        const shape = new p2.Circle({
            radius: BULLET_SIZE
        });
        this.body.addShape(shape);
        this.body.shapes[0].sensor = true;
        this.body.role = ROLES.BULLET;
        this.body.parent = this;
        this.game.world.addBody(this.body);

        //the player object of the shooter
        this.origin = origin;
        this.duration = 0;
    }
    update(){
        this.duration++;
        if(this.duration === BULLET_DURATION)
            this.destroy();
    }
    destroy(){
        const bullets = this.game.bullets;
        for(let i = bullets.length - 1; i >= 0; i--){
            if(bullets[i] === this){
                bullets.splice(i, 1);
            }
        }
        this.game.mapHitCheck(this.x, this.y, this.damage);
        this.game.world.removeBody(this.body);
    }
    get x(){
        return this.body.position[0];
    }
    get y(){
        return this.body.position[1];
    }
    toObject(){
        return {
            x: this.x,
            y: this.y,
            rotation: this.rotation,
            duration: this.duration,
            speed: this.speed
        }
    }
}
module.exports = Bullet;