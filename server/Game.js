const MAX_PLAYERS = 20;
const p2 = require("p2");
const ROOT2 = Math.sqrt(2);

const { MAX_TREES } = require("../shared/constants");
const { MAX_X } = require("../shared/constants");
const { MAX_Y } = require("../shared/constants");
const { FORESTID } = require("../shared/constants");
const { CITYID } = require("../shared/constants");
const { ROOFID } = require("../shared/constants");
const { ICEID } = require("../shared/constants");
const { HALFROAD } = require("../shared/constants");
const { TREE } = require("../shared/constants");
const { CAR } = require("../shared/constants");
const { SNAKE } = require("../shared/constants");

class Game{
    constructor(id, io){
        this.socket = io;
        this.players = [];
        this.id = id;
        this.world = new p2.World({
            gravity: [0, 0]
        });
        this.notholes = [];
        this.walls = [];
        this.maptype = 0;
        this.mapobjects = [];
        this.hazards = [];
        this.roads = [];

        this.createMap();
        this.socket.emit("map", 
            {
                notholes: this.notholes,
                walls: this.walls,
                maptype: this.maptype,
                mapobjects: this.mapobjects,
                hazards: this.hazards,
                roads: this.roads
            }
        );
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
    isJoinable(){
        return this.players.length < MAX_PLAYERS;
    }
    addPlayer(player){
        this.players.push(player);
        player.roomId = this.id;
    }
    tick(){
        //move players
        for(let i = 0; i < this.players.length; i++){
            const player = this.players[i];
            let movementSpeed = player.movementSpeed;
            player.body.velocity = [0, 0];
            if((player.movement.up || player.movement.down) && (player.movement.left || player.movement.right))
                movementSpeed *= ROOT2
            if(player.movement.up)
                player.body.velocity[1] = -movementSpeed;
            if(player.movement.down)
                player.body.velocity[1] = movementSpeed;
            if(player.movement.left)
                player.body.velocity[0] = -movementSpeed;
            if(player.movement.right)
                player.body.velocity[0] = movementSpeed;
        }
        this.world.step(1 / 60);
        
    }
    toObject(){
        const result = {};
        result.players = this.players.map(x => x.toObject());
        return result;
    }
}

module.exports = Game;