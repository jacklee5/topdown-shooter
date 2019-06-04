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
}

module.exports = Game;