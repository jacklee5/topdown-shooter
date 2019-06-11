const socket = io();

const CONSTANTS = require("../../shared/constants.js")

const MAX_TREES = CONSTANTS.MAX_TREES;
const MAX_X = CONSTANTS.MAX_X;
const MAX_Y = CONSTANTS.MAX_Y;
const FORESTID = CONSTANTS.FORESTID;
const CITYID = CONSTANTS.CITYID;
const ROOFID = CONSTANTS.ROOFID;
const ICEID = CONSTANTS.ICEID;
const HALFROAD = CONSTANTS.HALFROAD;
const TREE = CONSTANTS.TREE;
const CAR = CONSTANTS.CAR;
const SNAKE = CONSTANTS.SNAKE;

var notholes;
var walls;
var maptype;
var mapobjects;
var hazards;
var roads;

var clientData;
socket.on("map", data =>
    {
        notholes = data.notholes;
        walls = data.walls;
        maptype = data.maptype;
        mapobjects = data.mapobjects;
        hazards = data.hazards;
        roads = data.roads;
    }
);


// require("script.js");
// drawMap();

//page switching stuff
const PAGES = {
    HOME: 0,
    GAME: 1
}
let currentPage = PAGES.HOME;
let inGame = false;
const changePage = (id) => {
    const pages = document.getElementsByClassName("page");
    for(let i = 0; i < pages.length; i++){
        pages[i].style.display = "none";
    }
    pages[id].style.display = "block";

    //do page-specific things
    if(id === PAGES.GAME){
        document.body.style.overflow = "hidden";
        inGame = true;
        requestAnimationFrame(draw);
    }else{
        document.body.style.overflow = "auto";
        inGame = false;
    }
}

//join game button
document.getElementById("join-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const username = document.getElementById("username").value;
    socket.emit("new player", username);
})

//listen for joining game
socket.on("game found", (roomId) => {
    changePage(PAGES.GAME);
});

//set up the game
const KEYS = {
    UP: 87,
    LEFT: 65,
    DOWN: 83,
    RIGHT: 68
}
const keyStates = {};
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
let players = [];
//which player is the user
let user;
let height = window.innerHeight;
let width = window.innerWidth;
canvas.style.height = height + "px";
canvas.style.width = width + "px";
canvas.height = height;
canvas.width = width;

let HEIGHT = height;
let WIDTH = width;

const fill = (f) => {
    ctx.fillStyle = f;
}
const drawRect = (x, y, w, h) => {
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.closePath();
    ctx.fill();
}
const drawCircle = (x, y, r) => {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2*Math.PI); 
    ctx.closePath();
    ctx.fill();
}
//basic functions
const drawPlayer = (x, y, r) => {
    fill("red");
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(r);
    drawCircle(0, 0, CONSTANTS.PLAYER_SIZE);
    ctx.restore();
}

//draw loop
const draw = () => {
    if(!inGame) return;

    //handle controls
    const movement = {};
    movement.up = keyStates[KEYS.UP];
    movement.down = keyStates[KEYS.DOWN];
    movement.left = keyStates[KEYS.LEFT];
    movement.right = keyStates[KEYS.RIGHT];

    //draw background
    drawMap();

    //player loop thing
    for(let i = 0; i < players.length; i++){
        const player = players[i];
        if(player.id === socket.id)
            user = player;
    }

    if(user){    
        //draw players
        for(let i = 0; i < players.length; i++){
            const player = players[i];
            drawPlayer(player.x - user.x + width / 2, player.y - user.y + height / 2, player.rotation);
            if(player.id === socket.id)
                user = player;
        }

        //draw player health
        //outer thing
        fill("#E0E0E0");
        drawRect(width / 2 - 200, height - 75, 400, 40);
        //inner thing
        const health = user.health;
        if(health === 100)
            fill("#E0E0E0");
        else if(health > 75)
            fill("white");
        else   
            fill("red");
        drawRect(width / 2 - 196, height - 71, (health / 100) * 392, 32)
    }

    //send data to server
    socket.emit("movement", movement);

    requestAnimationFrame(draw);
}

//keyboard events
window.addEventListener("keydown", e => {
    keyStates[e.keyCode] = true;
});
window.addEventListener("keyup", e => {
    keyStates[e.keyCode] = false;
});

//dont make canvas stupid
window.addEventListener("resize", () => {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.style.height = height + "px";
    canvas.style.width = width + "px";
    canvas.height = height;
    canvas.width = width;
});

//listen for state change
socket.on("state", state => {
    players = state.players;
})

function drawMap() {
    ctx.fillStyle = "#008000";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    console.log(maptype);
    if (maptype === FORESTID) {
        ctx.fillStyle = "#FF8000";
        for (var i = 0; i < mapobjects.length; i++) {
            ctx.beginPath();
            ctx.arc(mapobjects[i].x / MAX_X * WIDTH, mapobjects[i].y / MAX_Y * HEIGHT, HEIGHT / 20 / 100 * mapobjects[i].health, 0, 2 * Math.PI);
            ctx.fill();
            console.log(mapobjects[i].x);
            console.log(mapobjects[i].y);
        }
    } else if (maptype === CITYID) {
        ctx.fillStyle = "#A0A0A0";
        for (var i = 0; i < roads.length; i++) {
            if (roads[i][0] === 1) {
                ctx.fillRect((roads[i][1] - 1.5 * HALFROAD) / MAX_X * WIDTH, 0, 3 * HALFROAD / MAX_X * WIDTH, HEIGHT);
            }
            if (roads[i][0] === 0) {
                ctx.fillRect(0, (roads[i][1] - 1.5 * HALFROAD) / MAX_Y * HEIGHT, WIDTH, 3 * HALFROAD / MAX_Y * HEIGHT);
            }
        }

        ctx.fillStyle = "#808080";
        for (var i = 0; i < roads.length; i++) {
            if (roads[i][0] === 1) {
                ctx.fillRect((roads[i][1] - HALFROAD) / MAX_X * WIDTH, 0, 2 * HALFROAD / MAX_X * WIDTH, HEIGHT);
            }
            if (roads[i][0] === 0) {
                ctx.fillRect(0, (roads[i][1] - HALFROAD) / MAX_Y * HEIGHT, WIDTH, 2 * HALFROAD / MAX_Y * HEIGHT);
            }
        }

        ctx.fillStyle = "#404040";
        for (var i = 0; i < walls.length; i++) {
            ctx.fillRect((walls[i][0]) / MAX_X * WIDTH, (walls[i][1]) / MAX_Y * HEIGHT, (walls[i][2] - walls[i][0]) / MAX_X * WIDTH, (walls[i][3] - walls[i][1]) / MAX_Y * HEIGHT);
        }

        ctx.fillStyle = "#808080";
        for (var i = 0; i < walls.length; i++) {
            ctx.fillRect((walls[i][0] + HALFROAD / 2) / MAX_X * WIDTH, (walls[i][1] + HALFROAD / 2) / MAX_Y * HEIGHT, (walls[i][2] - walls[i][0] - HALFROAD) / MAX_X * WIDTH, (walls[i][3] - walls[i][1] - HALFROAD) / MAX_Y * HEIGHT);
        }

        
    } else if (maptype === ROOFID) {
        ctx.fillStyle = "#A0A0A0";
        for (var i = 0; i < roads.length; i++) {
            if (roads[i][0] === 1) {
                ctx.fillRect((roads[i][1] - 1.5 * HALFROAD) / MAX_X * WIDTH, 0, 3 * HALFROAD / MAX_X * WIDTH, HEIGHT);
            }
            if (roads[i][0] === 0) {
                ctx.fillRect(0, (roads[i][1] - 1.5 * HALFROAD) / MAX_Y * HEIGHT, WIDTH, 3 * HALFROAD / MAX_Y * HEIGHT);
            }
        }

        ctx.fillStyle = "#808080";
        for (var i = 0; i < roads.length; i++) {
            if (roads[i][0] === 1) {
                ctx.fillRect((roads[i][1] - HALFROAD) / MAX_X * WIDTH, 0, 2 * HALFROAD / MAX_X * WIDTH, HEIGHT);
            }
            if (roads[i][0] === 0) {
                ctx.fillRect(0, (roads[i][1] - HALFROAD) / MAX_Y * HEIGHT, WIDTH, 2 * HALFROAD / MAX_Y * HEIGHT);
            }
        }
        
        ctx.fillStyle = "#404040";
        for (var i = 0; i < walls.length; i++) {
            ctx.fillRect((walls[i][0]) / MAX_X * WIDTH, (walls[i][1]) / MAX_Y * HEIGHT, (walls[i][2] - walls[i][0]) / MAX_X * WIDTH, (walls[i][3] - walls[i][1]) / MAX_Y * HEIGHT);
        }

        ctx.fillStyle = "#808080";
        for (var i = 0; i < walls.length; i++) {
            ctx.fillRect((walls[i][0] + HALFROAD / 2) / MAX_X * WIDTH, (walls[i][1] + HALFROAD / 2) / MAX_Y * HEIGHT, (walls[i][2] - walls[i][0] - HALFROAD) / MAX_X * WIDTH, (walls[i][3] - walls[i][1] - HALFROAD) / MAX_Y * HEIGHT);
        }


        
    } else if (maptype === ICEID) {
        ctx.fillStyle = "#00FFFF";
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
        ctx.fillStyle = "#80FFFF";
        ctx.beginPath();
        ctx.arc(WIDTH / 2, HEIGHT / 2, HEIGHT / 3, 0, 2 * Math.PI);
        ctx.fill();
    }
}

// returns all rectangular areas where players cannot stand. first array is index of rect.
// second array is info for each rect, 0 and 1 are first coord, 2 and 3 are second coord.
function rectBoundaries() {
    if (maptype === FORESTID) {
        return [];
    } else if (maptype === CITYID) {
        return walls;
    } else if (maptype === ROOFID) {
        return [];
    } else if (maptype === ICEID) {
        return [];
    }
}

// returns all circular areas where players cannot stand. first array is index of tree.
// second array is info for each tree, 0 is x, 1 is y, 3 is radius.
function circleBoundaries() {
    if (maptype === FORESTID) {
        circles = [];
        for (var i = 0; i < mapobjects.length; i++) {
            circles[i] = [
                mapobjects[i].x / MAX_X * WIDTH,
                mapobjects[i].y / MAX_Y * HEIGHT,
                HEIGHT / 20 / 100 * mapobjects[i].health
            ];
        }
    } else if (maptype === CITYID) {
        return [];
    } else if (maptype === ROOFID) {
        return [];
    } else if (maptype === ICEID) {
        return [];
    }
}

// returns all circular areas where players die. first array is index of tree.
// second array is info for each tree, 0 is x, 1 is y, 3 is radius.

function rectDeath() {
    if (maptype == FORESTID) {
        return [];
    } else if (maptype == CITYID) {
        return [];
    } else if (maptype == ROOFID) {
        rects = [];
        for (var i = 0; i < roads.length; i++) {
            if (roads[i][0] === 1) {
                rects[i] = [
                    (roads[i][1] - 1.5 * HALFROAD) / MAX_X * WIDTH, 
                    0, 
                    (roads[i][1] - 1.5 * HALFROAD) / MAX_X * WIDTH + 3 * HALFROAD / MAX_X * WIDTH, 
                    HEIGHT
                ];
            }
            if (roads[i][0] === 0) {
                rects[i] = [
                    0,
                    (roads[i][1] - 1.5 * HALFROAD) / MAX_Y * HEIGHT,
                    WIDTH,
                    (roads[i][1] - 1.5 * HALFROAD) / MAX_Y * HEIGHT + 3 * HALFROAD / MAX_Y * HEIGHT         
                ];
            }
        }
    } else if (maptype == ICEID) {
        return [];
    }
}

// returns all areas where you don't die in ice map.
// if empty array, it is not ice map.
function circleNotDeath() {
    if (maptype == ICEID) {
        return [WIDTH / 2, HEIGHT / 2, HEIGHT / 3];
    }
    else return [];
}