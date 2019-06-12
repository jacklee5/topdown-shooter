const MAX_PLAYERS = 20;
const p2 = require("p2");
const ROOT2 = Math.sqrt(2);

const { GAME_MODES, MAX_TREES, MAX_X, MAX_Y, FORESTID, CITYID, ROOFID, ICEID, HALFROAD, TREE, CAR, SNAKE, PLAYER_SIZE, ROLES } = require("../shared/constants");

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

        this.addWorldBounds();
        this.world.on("beginContact", event => {
            const a = event.bodyA;
            const b = event.bodyB;
            if(!(a.role === ROLES.BULLET || b.role === ROLES.BULLET)) return;
            let player;
            let bullet;
            if(a.role === ROLES.BULLET && b.role === ROLES.PLAYER){
                player = b.parent;
                bullet = a.parent;
            }else if(a.role === ROLES.PLAYER && b.role === ROLES.BULLET){
                player = a.parent;
                bullet = b.parent;
            }else if(a.role === ROLES.BULLET && b.role === ROLES.BULLET){
                return;
            }else if(a.role === ROLES.BULLET){
                bullet = a.parent;
            }else if(b.role === ROLES.BULLET){
                bullet = b.parent;
            }
            if(player === bullet.origin) return;
            if(player){
                player.health -= bullet.damage;
                if(player.health < 0){
                    bullet.origin.kill(player);
                }
            }
            bullet.destroy();
        })
    }

    rand() {
        return Math.random();
    }

    createMap() {
        this.maptype = Math.floor((Math.random() * 4));
        this.maptype = FORESTID;
        if (this.maptype === FORESTID) {
            for (let i = 0; i < MAX_TREES; i++) {
                this.mapobjects.push({
                    x: this.rand() * MAX_X,
                    y: this.rand() * MAX_Y,
                    health: 100
                });
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

        //do the physics stuff
        const rectBounds = this.rectBoundaries();
        for(let i = 0; i < rectBounds.length; i++){
            const x1 = rectBounds[i][0];
            const y1 = rectBounds[i][1];
            const x2 = rectBounds[i][2];
            const y2 = rectBounds[i][3];
            const dx = x2 - x1;
            const dy = y2 - y1;
            const cx = x1 + dx / 2;
            const cy = y1 + dy / 2;
            const body = new p2.Body({
                mass: 0,
                position: [cx, cy]
            });
            const shape = new p2.Box({
                width: dx,
                height: dy
            });
            
            body.addShape(shape);
            this.world.addBody(body);
        }

        const circleBounds = this.circleBoundaries();
        for(let i = 0; i < circleBounds.length; i++){
            const x = circleBounds[i][0];
            const y = circleBounds[i][1];
            const r = circleBounds[i][2];
            const body = new p2.Body({
                mass: 0,
                position: [x, y]
            });
            const shape = new p2.Circle({
                radius: r
            });
            body.addShape(shape);
            this.world.addBody(body);
        }
    }
    addWorldBounds(){
        //left wall
        const lBody = new p2.Body({
            mass: 0,
            position: [0, MAX_Y / 2]
        });
        const lShape = new p2.Box({
            width: 1,
            height: MAX_Y
        });
        lBody.addShape(lShape);
        this.world.addBody(lBody);
        //right wall
        const rBody = new p2.Body({
            mass: 0,
            position: [MAX_X, MAX_Y / 2]
        });
        const rShape = new p2.Box({
            width: 1,
            height: MAX_Y
        });
        rBody.addShape(rShape);
        this.world.addBody(rBody);
        //top wall
        const tBody = new p2.Body({
            mass: 0,
            position: [MAX_X / 2, 0]
        });
        const tShape = new p2.Box({
            width: MAX_X,
            height: 1
        });
        tBody.addShape(tShape);
        this.world.addBody(tBody);
        //bottom wall
        const bBody = new p2.Body({
            mass: 0,
            position: [MAX_X / 2, MAX_Y]
        });
        const bShape = new p2.Box({
            width: MAX_X,
            height: 1
        });
        bBody.addShape(bShape);
        this.world.addBody(bBody);
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
        this.world.addBody(player.body);
        player.roomId = this.id;
        player.game = this;
        if(this.maptype === ICEID){
            let r = Math.random() * (MAX_X / 3);
            let t = Math.random() * 2 * Math.PI;
            player.x = Math.round(MAX_X / 2 + r * Math.cos(t));
            player.y = Math.round(MAX_Y / 2 + r * Math.sin(t));
        }else{
            player.x = PLAYER_SIZE + Math.random() * (MAX_X - PLAYER_SIZE * 2);
            player.y = PLAYER_SIZE + Math.random() * (MAX_Y - PLAYER_SIZE * 2);
        }
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

    // returns all rectangular areas where players cannot stand. first array is index of rect.
    // second array is info for each rect, 0 and 1 are first coord, 2 and 3 are second coord.
    rectBoundaries() {
        if (this.maptype === FORESTID) {
            return [];
        } else if (this.maptype === CITYID) {
            return this.walls;
        } else if (this.maptype === ROOFID) {
            return [];
        } else if (this.maptype === ICEID) {
            return [];
        }
    }

    // returns all circular areas where players cannot stand. first array is index of tree.
    // second array is info for each tree, 0 is x, 1 is y, 3 is radius.
    circleBoundaries() {
        if (this.maptype === FORESTID) {
            let circles = [];
            for (var i = 0; i < this.mapobjects.length; i++) {
                circles[i] = [
                    this.mapobjects[i].x,
                    this.mapobjects[i].y,
                    20
                ];
            }
            return circles;
        } else if (this.maptype === CITYID) {
            return [];
        } else if (this.maptype === ROOFID) {
            return [];
        } else if (this.maptype === ICEID) {
            return [];
        }
    }

    // returns all circular areas where players die. first array is index of tree.
    // second array is info for each tree, 0 is x, 1 is y, 3 is radius.

    rectDeath() {
        if (this.maptype == FORESTID) {
            return [];
        } else if (this.maptype == CITYID) {
            return [];
        } else if (this.maptype == ROOFID) {
            rects = [];
            for (var i = 0; i < this.roads.length; i++) {
                if (this.roads[i][0] === 1) {
                    rects[i] = [
                        (this.roads[i][1] - 1.5 * HALFROAD), 
                        0, 
                        (this.roads[i][1] - 1.5 * HALFROAD) + 3 * HALFROAD, 
                        MAX_Y
                    ];
                }
                if (this.roads[i][0] === 0) {
                    this.rects[i] = [
                        0,
                        (roads[i][1] - 1.5 * HALFROAD),
                        MAX_X,
                        (roads[i][1] - 1.5 * HALFROAD) + 3 * HALFROAD         
                    ];
                }
            }
        } else if (this.maptype == ICEID) {
            return [];
        }
    }

    // returns all areas where you don't die in ice map.
    // if empty array, it is not ice map.
    circleNotDeath() {
        if (this.maptype == ICEID) {
            return [MAX_X / 2, MAX_Y / 2, MAX_Y / 3];
        }
        else return [];
    }
}

module.exports = Game;