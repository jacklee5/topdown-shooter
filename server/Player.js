const { ANIMATIONS, PLAYER_SIZE, HAND_ANGLE, WEAPONS, FIST_REACH, HAND_SIZE, GAME_MODES, ICEID, MAX_X, MAX_Y, ROLES, MOVEMENT_SPEED, RELOAD_TIME } = require("../shared/constants.js");
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
        this.movementSpeed = MOVEMENT_SPEED;
        this.id = id;
        this.rotation = 0;
        this.health = 100;

        let inv = [WEAPONS.AR, WEAPONS.REVOLVER, WEAPONS.FISTS]
        this.inventory = inv.map(x => {
            return {
                weapon: x,
                magazine: WEAPONS[x].magazine
            }
        });
        this.currentWeapon = 0;

        this.isPunching = false;
        this.socket;
        this.attackCooldown = 0;
        this.mouseDown = false;
        this.kills = 0;
        this.score = 0;
        this.reloadTimeout;

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
        this.body.parent = this;
        this.body.role = ROLES.PLAYER;

        //what movement keys the player is currently pressing
        this.movement = {
            up: false,
            down: false,
            left: false,
            right: false
        };
        this.weapons = {
            fist: false,
            pistol: false,
            ar: false
        }
    }
    fire(){
        this.mouseDown = true;
        if(this.reloadTimeout) return;
        if(this.weapon === WEAPONS.FISTS){
            if(this.animating) return;
            let rand = Math.floor(Math.random() * 2);
            this.animating = true;
            this.isPunching = true;
            if(rand === 0)
                this.animation = ANIMATIONS.PUNCH_LEFT;
            else
                this.animation = ANIMATIONS.PUNCH_RIGHT;
        }else if(this.attackCooldown === 0 && this.magazine > 0){
            const spread = WEAPONS[this.weapon].spread * 0.01;
            let r = this.rotation - Math.PI / 2 + (Math.random() * spread - spread / 2);
            let x = this.x + Math.cos(r) * WEAPONS[this.weapon].length;
            let y = this.y + Math.sin(r) * WEAPONS[this.weapon].length;
            this.game.bullets.push(new Bullet(x, y, r, this.weapon, this.game, this));
            this.attackCooldown = WEAPONS[this.weapon].cooldown;
            this.magazine--;
        }
    }
    release(){
        this.mouseDown = false;
    }
    update(){
        //movement
        let movementSpeed = this.movementSpeed;
        if(this.reloadTimeout || (WEAPONS[this.weapon].auto && this.mouseDown && !this.reloadTimeout)) 
            movementSpeed /= 2;
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

        //check if you accidentally played yourself
        if(this.game.maptype === ICEID){
            if(dist(this.x, this.y, MAX_X / 2, MAX_Y / 2) > MAX_X / 3){
                this.die();
            }
        }

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
                    player.health -= WEAPONS[player.weapon].damage;
                    this.isPunching = false;
                    if(player.health < 0){
                        this.kill(player);
                    }
                }
            }
        }

        if(this.attackCooldown > 0)
            this.attackCooldown--;
        if(WEAPONS[this.weapon].auto && this.attackCooldown === 0 && this.mouseDown && !this.reloadTimeout){
            this.fire();
        }

    }
    die(){
        this.socket.emit("death");
        this.deactivate();
    }
    kill(player){
        player.socket.emit("death");
        if(this.game.gameType === "Deathmatch")
            this.score++;
        else if(this.game.gameType === "CTF")
            this.score--;
        this.game.updateLeaderboard();
        player.deactivate();
    }
    reload(){
        this.reloadTimeout = setTimeout(() => {
            this.magazine = WEAPONS[this.weapon].magazine;
            this.socket.emit("done reloading");
            this.reloadTimeout = undefined;
        }, WEAPONS[this.weapon].reload * 1000)
    }
    nextWeapon(){
        this.switchWeapon((this.currentWeapon + 1) % this.inventory.length);
        
    }
    previousWeapon(){
        this.switchWeapon((this.currentWeapon - 1 + this.inventory.length) % this.inventory.length);
    }
    switchWeapon(x){
        if(x >= this.inventory.length) return;
        this.currentWeapon = x;
        if(!this.reloadTimeout) return;
        clearInterval(this.reloadTimeout);
        this.reloadTimeout = undefined;
        this.socket.emit("done reloading");
    }
    respawn(){
        this.activate();
        this.health = 100;
        this.game.spawnPlayer(this);
        const inv = this.inventory;
        for(let i = 0; i < inv.length; i++){
            inv[i].magazine = WEAPONS[inv[i].weapon].magazine;
        }
        this.mouseDown = false;
    }
    deactivate(){
        const players = this.game.players;
        for(let i = 0; i < players.length; i++){
            if(players[i] === this){
                players.splice(i, 1);
                break;
            }
        }
        this.deactivated = true;
        this.body.shapes[0].sensor = true;
    }
    activate(){
        const players = this.game.players;
        players.push(this);
        this.body.shapes[0].sensor = false;
        this.deactivated = false;
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
    insideObject(){
        const bodies = this.game.world.bodies;
        for(let i = 0; i < bodies.length; i++){
            if(this.body.overlaps(bodies[i]))
                return true;
        }
        return false;
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
            animation: this.animation,
            magazine: this.magazine,
            kills: this.score,
            inventory: this.inventory,
            currentWeapon: this.currentWeapon
        }
    }
    get x(){
        return this.body.position[0];
    }
    set x(x){
        this.body.position[0] = x;
    }
    get y(){
        return this.body.position[1];
    }
    set y(y){
        this.body.position[1] = y;
    }
    get weapon(){
        return this.inventory[this.currentWeapon].weapon;
    }
    get magazine(){
        return this.inventory[this.currentWeapon].magazine;
    }
    set magazine(x){
        this.inventory[this.currentWeapon].magazine = x;
    }
}
module.exports = Player;