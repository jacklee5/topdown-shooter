const MAX_PLAYERS = 20;
class Game{
    constructor(id){
        this.players = [];
        this.id = id;
    }
    isJoinable(){
        return this.players.length < MAX_PLAYERS;
    }
    addPlayer(player){
        this.players.push(player);
        player.roomId = this.id;
    }
    //do some initialization stuff like creating physics bodies
    start(){
        
    }
    tick(){
        //move players
        for(let i = 0; i < players.length; i++){
            const player = players[i];

        }
    }
}

module.exports = Game;