const MAX_PLAYERS = 20;
const p2 = require("p2");
const ROOT2 = Math.sqrt(2);

const { GAME_MODES, MAX_TREES, MAX_X, MAX_Y, FORESTID, CITYID, ROOFID, ICEID, HALFROAD, TREE, CAR, SNAKE } = require("../shared/constants");

class Game{
    constructor(id, io){
        this.players = [];
        this.bullets = [];
        this.id = id;
        this.world = new p2.World({
            gravity: [0, 0]
        });
        this.io = io;

        this.gameType = GAME_MODES.DEATHMATCH;

        this.notholes = [];
        this.walls = [];
        this.maptype = 0;
        this.mapobjects = [];
        this.hazards = [];
        this.roads = [];

        this.createMap();
        this.map = {
            notholes: this.notholes,
            walls: this.walls,
            maptype: this.maptype,
            mapobjects: this.mapobjects,
            hazards: this.hazards,
            roads: this.roads
        }
    }
    createMap() {
        console.log(FORESTID);
        this.maptype = Math.floor((Math.random() * 4));
        if (this.maptype === FORESTID) {
            for (var i = 0; i < MAX_TREES; i++) {
                this.mapobjects.push(TREE);
                this.mapobjects[i].x = (Math.random() * MAX_X);
                this.mapobjects[i].y = (Math.random() * MAX_Y);
            }
        } else if (this.maptype === CITYID) {
            var vert1 = (Math.random() * MAX_X / 7 + 1 * MAX_X / 5);
            var vert2 = (Math.random() * MAX_X / 7 + 3 * MAX_X / 5);
            var horz1 = (Math.random() * MAX_Y / 3 + 1 * MAX_Y / 3);
            this.roads.push([1, vert1], [1, vert2], [0, horz1]);
            this.walls.push(
                [0                    + HALFROAD / 2  , 0                    + HALFROAD / 2 , vert1 - 2 * HALFROAD - HALFROAD / 2 , horz1 - 2 * HALFROAD - HALFROAD / 2 ],
                [vert1 + 2 * HALFROAD + HALFROAD / 2  , 0                    + HALFROAD / 2 , vert2 - 2 * HALFROAD - HALFROAD / 2 , horz1 - 2 * HALFROAD - HALFROAD / 2 ],
                [vert2 + 2 * HALFROAD + HALFROAD / 2  , 0                    + HALFROAD / 2 , MAX_X                - HALFROAD / 2 , horz1 - 2 * HALFROAD - HALFROAD / 2 ],
                [0                    + HALFROAD / 2  , horz1 + 2 * HALFROAD + HALFROAD / 2 , vert1 - 2 * HALFROAD - HALFROAD / 2 , MAX_Y                - HALFROAD / 2 ],
                [vert1 + 2 * HALFROAD + HALFROAD / 2  , horz1 + 2 * HALFROAD + HALFROAD / 2 , vert2 - 2 * HALFROAD - HALFROAD / 2 , MAX_Y                - HALFROAD / 2 ],
                [vert2 + 2 * HALFROAD + HALFROAD / 2  , horz1 + 2 * HALFROAD + HALFROAD / 2 , MAX_X                - HALFROAD / 2 , MAX_Y                - HALFROAD / 2 ]
            );
        } else if (this.maptype === ROOFID) {
            var vert1 = (Math.random() * MAX_X / 7 + 1 * MAX_X / 5);
            var vert2 = (Math.random() * MAX_X / 7 + 3 * MAX_X / 5);
            var horz1 = (Math.random() * MAX_Y / 3 + 1 * MAX_Y / 3);
            this.roads.push([1, vert1], [1, vert2], [0, horz1]);
            this.walls.push(
                [0                    + HALFROAD / 2  , 0                    + HALFROAD / 2 , vert1 - 2 * HALFROAD - HALFROAD / 2 , horz1 - 2 * HALFROAD - HALFROAD / 2 ],
                [vert1 + 2 * HALFROAD + HALFROAD / 2  , 0                    + HALFROAD / 2 , vert2 - 2 * HALFROAD - HALFROAD / 2 , horz1 - 2 * HALFROAD - HALFROAD / 2 ],
                [vert2 + 2 * HALFROAD + HALFROAD / 2  , 0                    + HALFROAD / 2 , MAX_X                - HALFROAD / 2 , horz1 - 2 * HALFROAD - HALFROAD / 2 ],
                [0                    + HALFROAD / 2  , horz1 + 2 * HALFROAD + HALFROAD / 2 , vert1 - 2 * HALFROAD - HALFROAD / 2 , MAX_Y                - HALFROAD / 2 ],
                [vert1 + 2 * HALFROAD + HALFROAD / 2  , horz1 + 2 * HALFROAD + HALFROAD / 2 , vert2 - 2 * HALFROAD - HALFROAD / 2 , MAX_Y                - HALFROAD / 2 ],
                [vert2 + 2 * HALFROAD + HALFROAD / 2  , horz1 + 2 * HALFROAD + HALFROAD / 2 , MAX_X                - HALFROAD / 2 , MAX_Y                - HALFROAD / 2 ]
            );
        } else if (this.maptype === ICEID) {

        }
    }
    updateLeaderboard(){
        const arr = this.players.map(x => {
            return {
                name: x.name,
                score: x.score
            }
        });
        arr.sort((a, b) => {
            return b.score - a.score;
        })
        this.io.in(this.id).emit("leaderboard", arr);
    }
    isJoinable(){
        return this.players.length < MAX_PLAYERS;
    }
    addPlayer(player){
        this.players.push(player);
        player.roomId = this.id;
        this.updateLeaderboard();
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