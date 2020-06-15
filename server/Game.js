const MAX_PLAYERS = 20;
const p2 = require("p2");
const ROOT2 = Math.sqrt(2);

const { GAME_MODES, MAX_TREES, MAX_X, MAX_Y, FORESTID, CITYID, ROOFID, ICEID, CTF, HALFROAD, PLAYER_SIZE, ROLES, GAME_LENGTH, MOVEMENT_SPEED } = require("../shared/constants");

class Game{
    constructor(id, io){
        this.players = [];
        this.bullets = [];
        this.id = id;
        this.world = new p2.World({
            gravity: [0, 0]
        });
        this.io = io;

        this.gameType = GAME_MODES[Math.floor(Math.random() * GAME_MODES.length)];
        this.gameType = "CTF";

        if(this.gameType === "CTF"){
            this.team1Count = 0;
            this.team2Count = 0;
        }

        this.killzones = [];
        this.shapes = [];
        this.boundaries = [];

        this.maptype = 0;
        this.mapobjects = [];
        this.hazards = [];
        this.finished = false;

        this.timeRemaining = GAME_LENGTH;

        this.createMap();
        this.map = {
            killzones: this.killzones,
            shapes: this.shapes,
            boundaries: this.boundaries,

            maptype: this.maptype,
            mapobjects: this.mapobjects.map(item => {
                return {
                    x: item.x,
                    y: item.y,
                    health: item.health,
                    type: item.type
                }
            }),
            hazards: this.hazards
        }

        this.addWorldBounds();
        this.world.on("beginContact", event => {
            const a = event.bodyA;
            const b = event.bodyB;
            if(a.role === ROLES.BORDER || b.role === ROLES.BORDER) return;
            if(!(a.role === ROLES.BULLET || b.role === ROLES.BULLET)) return;
            let player;
            let bullet;
            let tree;
            let flag;
            if(a.role === ROLES.BULLET && b.role === ROLES.PLAYER){
                player = b.parent;
                bullet = a.parent;
            }else if(a.role === ROLES.PLAYER && b.role === ROLES.BULLET){
                player = a.parent;
                bullet = b.parent;
            }else if(a.role === ROLES.BULLET && b.role === ROLES.TREE){
                tree = b.parent;
                bullet = a.parent;
            }else if(a.role === ROLES.TREE && b.role === ROLES.BULLET){
                tree = a.parent;
                bullet = b.parent;
            }else if(a.role === ROLES.BULLET && b.role === ROLES.BULLET){
                return;
            }else if(a.role === ROLES.BULLET){
                bullet = a.parent;
            }else if(b.role === ROLES.BULLET){
                bullet = b.parent;
            }
            if(player){
                if(player === bullet.origin) return;
                if(player.deactivated) return;
                player.health -= bullet.damage;
                if(player.health < 0){
                    bullet.origin.kill(player);
                }
            }
            if(tree){
                tree.health -= bullet.damage;
                tree.body.shapes[0].radius = tree.health / 5 + 5;
                if(tree.health < 0){
                    this.world.removeBody(tree.body);
                    const trees = this.mapobjects;
                    for(let i = 0; i < trees.length; i++){
                        if(trees[i] === tree){
                            this.mapobjects.splice(i, 1);
                            break;
                        }
                    }
                }
                this.io.in(this.id).emit("trees", this.mapobjects.map(item => {
                    return {
                        x: item.x,
                        y: item.y,
                        health: item.health,
                        type: item.type
                    }
                }));
            }
            bullet.destroy();
        })
    }

    rand() {
        return Math.random();
    }

    //here lies maphitcheck

    // [rewrite] create map
    createMap() {
        this.maptype = Math.floor((Math.random() * 3));
        if (this.gameType === "CTF")
            this.maptype = CTF;
        if (this.maptype === FORESTID) {
            this.shapes.push(
                {
                    type: "background",
                    color: "#008000"
                }
            );
            
            for (let i = 0; i < MAX_TREES; i++) {
                this.mapobjects.push({
                    x: this.rand() * MAX_X,
                    y: this.rand() * MAX_Y,
                    health: 100,
                    type: "tree"
                });
            }
            
        } else if (this.maptype === CITYID) {
            var road_thickness = MAX_Y / 16;
            var path_thickness = MAX_Y / 16 * (3 / 2);
            var half_road = road_thickness / 2;
            var roof_thickness = half_road * 3 / 2;
            var road_color = "#808080";
            var path_color = "#A0A0A0";

            this.shapes.push(
                {
                    type: "background",
                    color: "#008000"
                }
            );

            // find the centers of the randomly generated roads
            var vert1 = (Math.floor(Math.random() * MAX_X / 5) + 1 * MAX_X / 5);
            var vert2 = (Math.floor(Math.random() * MAX_X / 5) + 3 * MAX_X / 5);
            var horz1 = MAX_Y - (Math.floor(Math.random() * MAX_Y / 3) + 1 * MAX_Y / 3);
            
            // push rectangles for sidewalks
            this.shapes.push(
                {
                    type: "rect",
                    color: path_color,
                    cord1: [vert1 - path_thickness, MAX_Y],
                    cord2: [vert1 + path_thickness, 0]
                }
            );
            this.shapes.push(
                {
                    type: "rect",
                    color: path_color,
                    cord1: [vert2 - path_thickness, MAX_Y],
                    cord2: [vert2 + path_thickness, 0]
                }
            );
            this.shapes.push(
                {
                    type: "rect",
                    color: path_color,
                    cord1: [0, horz1 + path_thickness],
                    cord2: [MAX_X, horz1 - path_thickness]
                }
            );

            // push rectangles for roads
            this.shapes.push(
                {
                    type: "rect",
                    color: road_color,
                    cord1: [vert1 - road_thickness, MAX_Y],
                    cord2: [vert1 + road_thickness, 0]
                }
            );
            this.shapes.push(
                {
                    type: "rect",
                    color: road_color,
                    cord1: [vert2 - road_thickness, MAX_Y],
                    cord2: [vert2 + road_thickness, 0]
                }
            );
            this.shapes.push(
                {
                    type: "rect",
                    color: road_color,
                    cord1: [0, horz1 + road_thickness],
                    cord2: [MAX_X, horz1 - road_thickness]
                }
            );

            // push rectangles for buildings (outer) (left to right, up to down)
            // first row
            this.shapes.push(
                {
                    type: "rect",
                    color: road_color,
                    cord1: [half_road, MAX_Y - half_road],
                    cord2: [vert1 - half_road - path_thickness, horz1 + half_road + path_thickness]
                }
            );

            this.shapes.push(
                {
                    type: "rect",
                    color: road_color,
                    cord1: [vert1 + half_road + path_thickness, MAX_Y - half_road],
                    cord2: [vert2 - half_road - path_thickness, horz1 + half_road + path_thickness]
                }
            );

            this.shapes.push(
                {
                    type: "rect",
                    color: road_color,
                    cord1: [vert2 + half_road + path_thickness, MAX_Y - half_road],
                    cord2: [MAX_X - half_road, horz1 + half_road + path_thickness]
                }
            );
            
            // second row
            this.shapes.push(
                {
                    type: "rect",
                    color: road_color,
                    cord1: [half_road, horz1 - half_road - path_thickness],
                    cord2: [vert1 - half_road - path_thickness, half_road]
                }
            );

            this.shapes.push(
                {
                    type: "rect",
                    color: road_color,
                    cord1: [vert1 + half_road + path_thickness, horz1 - half_road - path_thickness],
                    cord2: [vert2 - half_road - path_thickness, half_road]
                }
            );

            this.shapes.push(
                {
                    type: "rect",
                    color: road_color,
                    cord1: [vert2 + half_road + path_thickness, horz1 - half_road - path_thickness],
                    cord2: [MAX_X - half_road, half_road]
                }
            );

            // push rectangles for buildings (inner) (left to right, up to down)
            // first row
            this.shapes.push(
                {
                    type: "rect",
                    color: path_color,
                    cord1: [roof_thickness, MAX_Y - roof_thickness],
                    cord2: [vert1 - roof_thickness - path_thickness, horz1 + roof_thickness + path_thickness]
                }
            );

            this.shapes.push(
                {
                    type: "rect",
                    color: path_color,
                    cord1: [vert1 + roof_thickness + path_thickness, MAX_Y - roof_thickness],
                    cord2: [vert2 - roof_thickness - path_thickness, horz1 + roof_thickness + path_thickness]
                }
            );

            this.shapes.push(
                {
                    type: "rect",
                    color: path_color,
                    cord1: [vert2 + roof_thickness + path_thickness, MAX_Y - roof_thickness],
                    cord2: [MAX_X - roof_thickness, horz1 + roof_thickness + path_thickness]
                }
            );
            
            // second row
            this.shapes.push(
                {
                    type: "rect",
                    color: path_color,
                    cord1: [roof_thickness, horz1 - roof_thickness - path_thickness],
                    cord2: [vert1 - roof_thickness - path_thickness, roof_thickness]
                }
            );

            this.shapes.push(
                {
                    type: "rect",
                    color: path_color,
                    cord1: [vert1 + roof_thickness + path_thickness, horz1 - roof_thickness - path_thickness],
                    cord2: [vert2 - roof_thickness - path_thickness, roof_thickness]
                }
            );

            this.shapes.push(
                {
                    type: "rect",
                    color: path_color,
                    cord1: [vert2 + roof_thickness + path_thickness, horz1 - roof_thickness - path_thickness],
                    cord2: [MAX_X - roof_thickness, roof_thickness]
                }
            );

            // push rectangles for boundaries (left to right, up to down)
            // first row
            this.boundaries.push(
                {
                    type: "rect",
                    cord1: [half_road, MAX_Y - half_road],
                    cord2: [vert1 - half_road - path_thickness, horz1 + half_road + path_thickness]
                }
            );

            this.boundaries.push(
                {
                    type: "rect",
                    cord1: [vert1 + half_road + path_thickness, MAX_Y - half_road],
                    cord2: [vert2 - half_road - path_thickness, horz1 + half_road + path_thickness]
                }
            );

            this.boundaries.push(
                {
                    type: "rect",
                    cord1: [vert2 + half_road + path_thickness, MAX_Y - half_road],
                    cord2: [MAX_X - half_road, horz1 + half_road + path_thickness]
                }
            );
            
            // second row
            this.boundaries.push(
                {
                    type: "rect",
                    cord1: [half_road, horz1 - half_road - path_thickness],
                    cord2: [vert1 - half_road - path_thickness, half_road]
                }
            );

            this.boundaries.push(
                {
                    type: "rect",
                    cord1: [vert1 + half_road + path_thickness, horz1 - half_road - path_thickness],
                    cord2: [vert2 - half_road - path_thickness, half_road]
                }
            );

            this.boundaries.push(
                {
                    type: "rect",
                    cord1: [vert2 + half_road + path_thickness, horz1 - half_road - path_thickness],
                    cord2: [MAX_X - half_road, half_road]
                }
            );
        } 
        else if (this.maptype === ICEID) {
            this.shapes.push(
                {
                    type: "background",
                    color: "#00FFFF"
                }
            );
            this.shapes.push(
                {
                    type: "circle",
                    color: "#80FFFF",
                    cord: [MAX_X / 2, MAX_Y / 2],
                    radius: MAX_X / 3
                }
            );
            this.killzones.push(
                {
                    type: "circle",
                    invert: 1,
                    cord: [MAX_X / 2, MAX_Y / 2],
                    radius: MAX_X / 3
                }
            );
        }
        else if (this.maptype === CTF) {
            var floor = "#AC7C00";
            var wall = "#4A4A4A";

            //left side
            this.shapes.push(
                {
                    type: "background",
                    color: "#008000"
                }
            );
            this.shapes.push(
                {
                    type: "rect",
                    color: wall,
                    cord1: [0, MAX_Y],
                    cord2: [480, 0]
                }
            );
            this.shapes.push(
                {
                    type: "rect",
                    color: floor,
                    cord1: [40, MAX_Y - 40],
                    cord2: [440, MAX_Y - 520]
                }
            )
            this.shapes.push(
                {
                    type: "rect",
                    color: floor,
                    cord1: [140, MAX_Y - 519],
                    cord2: [340, MAX_Y - 561]
                }
            )
            this.shapes.push(
                {
                    type: "rect",
                    color: floor,
                    cord1: [439, MAX_Y - 140],
                    cord2: [480, MAX_Y - 360]
                }
            )
            this.shapes.push(
                {
                    type: "rect",
                    color: floor,
                    cord1: [439, 360],
                    cord2: [480, 140]
                }
            )
            this.shapes.push(
                {
                    type: "rect",
                    color: floor,
                    cord1: [40, 520],
                    cord2: [440, 40]
                }
            )

            //middle
            this.shapes.push(
                {
                    type: "circle",
                    color: wall,
                    cord: [MAX_X / 2, MAX_Y / 2],
                    radius: 200
                }
            )
            this.shapes.push(
                {
                    type: "circle",
                    color: floor,
                    cord: [MAX_X / 2, MAX_Y / 2],
                    radius: 160
                }
            )

            //right side
            this.shapes.push(
                {
                    type: "rect",
                    color: wall,
                    cord1: [MAX_X - 0, MAX_Y],
                    cord2: [MAX_X - 480, 0]
                }
            );
            this.shapes.push(
                {
                    type: "rect",
                    color: floor,
                    cord1: [MAX_X - 40, MAX_Y - 40],
                    cord2: [MAX_X - 440, MAX_Y - 520]
                }
            )
            this.shapes.push(
                {
                    type: "rect",
                    color: floor,
                    cord1: [MAX_X - 140, MAX_Y - 519],
                    cord2: [MAX_X - 339, MAX_Y - 561]
                }
            )
            this.shapes.push(
                {
                    type: "rect",
                    color: floor,
                    cord1: [MAX_X - 439, MAX_Y - 140],
                    cord2: [MAX_X - 480, MAX_Y - 360]
                }
            )
            this.shapes.push(
                {
                    type: "rect",
                    color: floor,
                    cord1: [MAX_X - 439, 360],
                    cord2: [MAX_X - 480, 140]
                }
            )
            this.shapes.push(
                {
                    type: "rect",
                    color: floor,
                    cord1: [MAX_X - 40, 520],
                    cord2: [MAX_X - 440, 40]
                }
            )

            //do boundaries
            //left
            this.boundaries.push(
                {
                    type: "rect",
                    cord1: [0, MAX_Y],
                    cord2: [40, 0]
                }
            )
            this.boundaries.push(
                {
                    type: "rect",
                    cord1: [40, MAX_Y],
                    cord2: [440, MAX_Y - 40]
                }
            )
            this.boundaries.push(
                {
                    type: "rect",
                    cord1: [440, MAX_Y],
                    cord2: [480, MAX_Y - 140]
                }
            )
            this.boundaries.push(
                {
                    type: "rect",
                    cord1: [0, MAX_Y - 40],
                    cord2: [40, 0]
                }
            )
            this.boundaries.push(
                {
                    type: "rect",
                    cord1: [40, MAX_Y - 520],
                    cord2: [140, MAX_Y - 560]
                }
            )
            this.boundaries.push(
                {
                    type: "rect",
                    cord1: [340, MAX_Y - 520],
                    cord2: [440, MAX_Y - 560]
                }
            )
            this.boundaries.push(
                {
                    type: "rect",
                    cord1: [440, MAX_Y - 360],
                    cord2: [480, MAX_Y - 720]
                }
            )
            this.boundaries.push(
                {
                    type: "rect",
                    cord1: [40, 40],
                    cord2: [0, 480]
                }
            )
            //right side
            this.boundaries.push(
                {
                    type: "rect",
                    cord1: [MAX_X - 0, MAX_Y],
                    cord2: [MAX_X - 40, 0]
                }
            )
            this.boundaries.push(
                {
                    type: "rect",
                    cord1: [MAX_X - 40, MAX_Y],
                    cord2: [MAX_X - 440, MAX_Y - 40]
                }
            )
            this.boundaries.push(
                {
                    type: "rect",
                    cord1: [MAX_X - 440, MAX_Y],
                    cord2: [MAX_X - 480, MAX_Y - 140]
                }
            )
            this.boundaries.push(
                {
                    type: "rect",
                    cord1: [MAX_X - 0, MAX_Y - 40],
                    cord2: [MAX_X - 40, 0]
                }
            )
            this.boundaries.push(
                {
                    type: "rect",
                    cord1: [MAX_X - 40, MAX_Y - 520],
                    cord2: [MAX_X - 140, MAX_Y - 560]
                }
            )
            this.boundaries.push(
                {
                    type: "rect",
                    cord1: [MAX_X - 340, MAX_Y - 520],
                    cord2: [MAX_X - 440, MAX_Y - 560]
                }
            )
            this.boundaries.push(
                {
                    type: "rect",
                    cord1: [MAX_X - 440, MAX_Y - 360],
                    cord2: [MAX_X - 480, MAX_Y - 720]
                }
            )
            this.boundaries.push(
                {
                    type: "rect",
                    cord1: [MAX_X - 40, 40],
                    cord2: [MAX_X - 0, 480]
                }
            )
            this.boundaries.push(
                {
                    type: "circle",
                    cord: [MAX_X / 2, MAX_Y / 2],
                    radius: 200
                }
            )
        }

        const bounds = this.boundaries;
        const objects = this.mapobjects;

        for (let i = 0; i < bounds.length; i++) {
            if (bounds[i].type === "rect") {
                const x1 = bounds[i].cord1[0];
                const y1 = bounds[i].cord1[1];
                const x2 = bounds[i].cord2[0];
                const y2 = bounds[i].cord2[1];
                const dx = x2 - x1;
                const dy = y2 - y1;
                const cx = x1 + dx / 2;
                const cy = y1 + dy / 2;
                const body = new p2.Body({
                    mass: 0,
                    position: [cx, cy]
                });
                const shape = new p2.Box({
                    width: Math.abs(dx),
                    height: Math.abs(dy)
                });

                body.addShape(shape);
                this.world.addBody(body);
            } else if (bounds[i].type === "circle") {
                const x = bounds[i].cord[0];
                const y = bounds[i].cord[1];
                const r = bounds[i].radius;
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

        for (let i = 0; i < objects; i++) {
            if (objects[i].type === "tree") {
                const x = objects[i].x;
                const y = objects[i].y;
                const r = objects[i].health / 5 * 5;
                const body = new p2.Body({
                    mass: 0,
                    position: [x, y]
                });
                const shape = new p2.Circle({
                    radius: r
                });
                body.addShape(shape);
                this.world.addBody(body);
                this.mapobjects[i].body = body;
                body.role = ROLES.TREE;
                body.parent = this.mapobjects[i];
            }
        }
    }
    addWorldBounds(){
        const wallWidth = 1000;
        //left wall
        const lBody = new p2.Body({
            mass: 0,
            position: [-wallWidth / 2, MAX_Y / 2]
        });
        const lShape = new p2.Box({
            width: wallWidth,
            height: MAX_Y
        });
        lBody.addShape(lShape);
        lBody.role = ROLES.BORDER;
        this.world.addBody(lBody);
        //right wall
        const rBody = new p2.Body({
            mass: 0,
            position: [MAX_X + wallWidth / 2, MAX_Y / 2]
        });
        const rShape = new p2.Box({
            width: wallWidth,
            height: MAX_Y
        });
        rBody.addShape(rShape);
        rBody.role = ROLES.BORDER;
        this.world.addBody(rBody);
        //top wall
        const tBody = new p2.Body({
            mass: 0,
            position: [MAX_X / 2, -wallWidth / 2]
        });
        const tShape = new p2.Box({
            width: MAX_X,
            height: wallWidth
        });
        tBody.addShape(tShape);
        tBody.role = ROLES.BORDER;
        this.world.addBody(tBody);
        //bottom wall
        const bBody = new p2.Body({
            mass: 0,
            position: [MAX_X / 2, MAX_Y + wallWidth / 2]
        });
        const bShape = new p2.Box({
            width: MAX_X,
            height: wallWidth
        });
        bBody.addShape(bShape);
        bBody.role = ROLES.BORDER;
        this.world.addBody(bBody);
    }
    updateLeaderboard(){
        const arr = this.players.map(x => {
            return {
                name: x.name,
                score: x.score,
                team: x.team
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
        if(this.gameType === "CTF"){
            if(this.team1Count < this.team2Count){
                this.team1Count++;
                player.team = 1;
            }
            else{
                this.team2Count++;
                player.team = 2;
            }
        }
        this.spawnPlayer(player);
        this.updateLeaderboard();
    }
    spawnPlayer(player){
        if(this.maptype === ICEID){
            let r = Math.random() * (MAX_X / 3);
            let t = Math.random() * 2 * Math.PI;
            player.x = Math.round(MAX_X / 2 + r * Math.cos(t));
            player.y = Math.round(MAX_Y / 2 + r * Math.sin(t));
        }else if(this.maptype === CTF){
            let r = Math.random() * 200;
            let t = Math.random() * 2 * Math.PI;
            if(player.team === 1)
                player.x = 240;
            else
                player.x = MAX_X - 240;
            player.y = MAX_Y - 240;
            player.x += Math.round(r * Math.cos(t));
            player.y += Math.round(r * Math.sin(t));
        }
        else{
            player.x = PLAYER_SIZE + Math.random() * (MAX_X - PLAYER_SIZE * 2);
            player.y = PLAYER_SIZE + Math.random() * (MAX_Y - PLAYER_SIZE * 2);
        }
    }
    tick(io){
        if(this.timeRemaining === 0){
            this.io.in(this.id).emit("game over");
        }
        if(this.timeRemaining < 0) {
            this.finished = true;
            return;
        }
        this.timeRemaining--;
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
        result.timeRemaining = this.timeRemaining / 60;
        return result;
    }
}

module.exports = Game;