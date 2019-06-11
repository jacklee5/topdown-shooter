const MAX_PLAYERS = 20;
const p2 = require("p2");
class Game{
    constructor(id){
        this.players = [];
        this.bullets = [];
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
        for(let i = 0; i < this.players.length; i++)
            this.players[i].update();
        
        //update bullets
        for(let i = 0; i < this.bullets.length; i++)
            this.bullets[i].update();

        this.world.step(1 / 60);
    }
    toObject(){
        const result = {};
        result.players = this.players.map(x => x.toObject());
        result.bullets = this.bullets.map(x => x.toObject());
        return result;
    }
}

module.exports = Game;