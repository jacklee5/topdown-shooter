(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
const CONSTANTS = { 
    PLAYER_SIZE: 15,
    MAX_TREES: 20,
	MAX_X: 1920,
	MAX_Y: 1080,
	FORESTID: 0,
	CITYID: 1,
	ROOFID: 2,
	ICEID: 3,
	HALFROAD: (1920 / 30),
	TREE: {
	    health: 100
	},

	CAR: {
	    speed: 100
	},

	SNAKE: {
	    health: 25
	},
    //radians
    HAND_ANGLE: 45 * Math.PI / 180,
    HAND_SIZE: 5,
    FIST_REACH: 15,
    BULLET_SIZE: 3,
    //enum for weapons, similar to below
    WEAPONS: {
        FISTS: 0,
        0: {
            damage: 30
        },
        PISTOL: 1,
        1: {
            damage: 15,
            speed: 5,
            cooldown: 30
        },
        AR: 2,
        2: {
            damage: 12,
            speed: 4,
            cooldown: 45,
            auto: true
        }
    },
    //enum for animations and the corresponding numbers encode values for the animation
    ANIMATIONS: {
        PUNCH_LEFT: 0,
        0: {
            length: 120
        },
        PUNCH_RIGHT: 1,
        1: {
            length: 120
        }
    }, 
    GAME_MODES: {
        DEATHMATCH: 0
    }
}
module.exports = CONSTANTS;
},{}],2:[function(require,module,exports){
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
    RIGHT: 68,
    VIEW_STATS: 9
}
const keyStates = {};
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
let players = [];
let bullets = [];
//which player is the user
let user;
let height = window.innerHeight;
let width = window.innerWidth;
canvas.style.height = height + "px";
canvas.style.width = width + "px";
canvas.height = height;
canvas.width = width;

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

//stuff that stays the same (for left hand)
const HAND_X = Math.cos(CONSTANTS.HAND_ANGLE) * CONSTANTS.PLAYER_SIZE;
const HAND_Y = -Math.sin(CONSTANTS.HAND_ANGLE) * CONSTANTS.PLAYER_SIZE;
const drawPlayer = (player) => {
    let x = player.x - user.x + width / 2;
    let y = player.y - user.y + height / 2;
    let r = player.rotation;
    fill("red");

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(r);
    
    //body
    drawCircle(0, 0, CONSTANTS.PLAYER_SIZE);

    fill("red");
    //hands
    let rightX = HAND_X, rightY = HAND_Y, leftX = -HAND_X, leftY = HAND_Y;
    if(player.weapon === CONSTANTS.WEAPONS.PISTOL){
        rightX = 0;
        rightY = -CONSTANTS.PLAYER_SIZE - 4;
        leftX = 0;
        leftY = -CONSTANTS.PLAYER_SIZE - 4;
    }else if(player.weapon === CONSTANTS.WEAPONS.AR){
        rightX = 0;
        leftX = 4;
        rightY = -CONSTANTS.PLAYER_SIZE - 4;
        leftY = -CONSTANTS.PLAYER_SIZE - 20;
    }
    if(player.animating){
        if(player.animation === CONSTANTS.ANIMATIONS.PUNCH_LEFT){
            const length = CONSTANTS.ANIMATIONS[player.animation].length;
            leftX += Math.sin(player.animationProgress * Math.PI / length) * CONSTANTS.FIST_REACH;
            leftY -= Math.sin(player.animationProgress * Math.PI / length) * CONSTANTS.FIST_REACH;
        }
        if(player.animation === CONSTANTS.ANIMATIONS.PUNCH_RIGHT){
            const length = CONSTANTS.ANIMATIONS[player.animation].length;
            rightX -= Math.sin(player.animationProgress * Math.PI / length) * CONSTANTS.FIST_REACH;
            rightY -= Math.sin(player.animationProgress * Math.PI / length) * CONSTANTS.FIST_REACH;
        }
        
    }
    drawCircle(leftX, leftY, CONSTANTS.HAND_SIZE);
    drawCircle(rightX, rightY, CONSTANTS.HAND_SIZE);

    //gun
    if(player.weapon === CONSTANTS.WEAPONS.PISTOL){
        fill("black");
        drawRect(-2, -CONSTANTS.PLAYER_SIZE - 2, 4, -18);
    }else if(player.weapon === CONSTANTS.WEAPONS.AR){
        fill("black")
        drawRect(-2, -CONSTANTS.PLAYER_SIZE - 2, 4, -32);
    }

    ctx.restore();
}

const drawBullet = (bullet) => {
    let x = bullet.x - user.x + width / 2;
    let y = bullet.y - user.y + height / 2;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(bullet.rotation);
    
    fill("black");
    drawCircle(0, 0, CONSTANTS.BULLET_SIZE);

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

    //player loop thing
    //find out which person is the user
    for(let i = 0; i < players.length; i++){
        const player = players[i];
        if(player.id === socket.id)
            user = player;
    }


    //draw bullets
    for(let i = 0; i < bullets.length; i++){
        drawBullet(bullets[i]);
    }


    //draw players
    if(user){
        drawMap();
        for(let i = 0; i < players.length; i++){
            const player = players[i];
            drawPlayer(player);
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
        drawRect(width / 2 - 196, height - 71, (health > 0 ? health / 100 : 0) * 392, 32)
    }

    //send data to server
    socket.emit("movement", movement);

    requestAnimationFrame(draw);
}

//keyboard events
window.addEventListener("keydown", e => {
    keyStates[e.keyCode] = true;
    if(e.keyCode === KEYS.VIEW_STATS){
        e.preventDefault();
        document.getElementById("game-info").style.display = "block";
    }
});
window.addEventListener("keyup", e => {
    keyStates[e.keyCode] = false;
    if(e.keyCode === KEYS.VIEW_STATS){
        e.preventDefault();
        document.getElementById("game-info").style.display = "none";
    }
});
window.addEventListener("mousedown", () => {
    socket.emit("fire");
});
window.addEventListener("mouseup", () => {
    socket.emit("release")
})

//rotate player
window.addEventListener("mousemove", e => {
    socket.emit("rotation", Math.atan2((e.clientX - width / 2), (height / 2 - e.clientY)));
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
    bullets = state.bullets;
});

function drawMap() {
    ctx.fillStyle = "#008000";
    ctx.fillRect(0, 0, width, height);
    console.log(maptype);
    if (maptype === FORESTID) {
        ctx.fillStyle = "#FF8000";
        for (var i = 0; i < mapobjects.length; i++) {
            ctx.beginPath();
            ctx.arc(mapobjects[i].x / MAX_X * width, mapobjects[i].y / MAX_Y * height, height / 20 / 100 * mapobjects[i].health, 0, 2 * Math.PI);
            ctx.fill();
            console.log(mapobjects[i].x);
            console.log(mapobjects[i].y);
        }
    } else if (maptype === CITYID) {
        ctx.fillStyle = "#A0A0A0";
        for (var i = 0; i < roads.length; i++) {
            if (roads[i][0] === 1) {
                doRect((roads[i][1] - 1.5 * HALFROAD) / MAX_X * width, 0, 3 * HALFROAD / MAX_X * width, height);
            }
            if (roads[i][0] === 0) {
                doRect(0, (roads[i][1] - 1.5 * HALFROAD) / MAX_Y * height, width, 3 * HALFROAD / MAX_Y * height);
            }
        }

        ctx.fillStyle = "#808080";
        for (var i = 0; i < roads.length; i++) {
            if (roads[i][0] === 1) {
                doRect((roads[i][1] - HALFROAD) / MAX_X * width, 0, 2 * HALFROAD / MAX_X * width, height);
            }
            if (roads[i][0] === 0) {
                doRect(0, (roads[i][1] - HALFROAD) / MAX_Y * height, width, 2 * HALFROAD / MAX_Y * height);
            }
        }

        ctx.fillStyle = "#404040";
        for (var i = 0; i < walls.length; i++) {
            doRect((walls[i][0]) / MAX_X * width, (walls[i][1]) / MAX_Y * height, (walls[i][2] - walls[i][0]) / MAX_X * width, (walls[i][3] - walls[i][1]) / MAX_Y * height);
        }

        ctx.fillStyle = "#808080";
        for (var i = 0; i < walls.length; i++) {
            doRect((walls[i][0] + HALFROAD / 2) / MAX_X * width, (walls[i][1] + HALFROAD / 2) / MAX_Y * height, (walls[i][2] - walls[i][0] - HALFROAD) / MAX_X * width, (walls[i][3] - walls[i][1] - HALFROAD) / MAX_Y * height);
        }

        
    } else if (maptype === ROOFID) {
        ctx.fillStyle = "#A0A0A0";
        for (var i = 0; i < roads.length; i++) {
            if (roads[i][0] === 1) {
                doRect((roads[i][1] - 1.5 * HALFROAD) / MAX_X * width, 0, 3 * HALFROAD / MAX_X * width, height);
            }
            if (roads[i][0] === 0) {
                doRect(0, (roads[i][1] - 1.5 * HALFROAD) / MAX_Y * height, width, 3 * HALFROAD / MAX_Y * height);
            }
        }

        ctx.fillStyle = "#808080";
        for (var i = 0; i < roads.length; i++) {
            if (roads[i][0] === 1) {
                doRect((roads[i][1] - HALFROAD) / MAX_X * width, 0, 2 * HALFROAD / MAX_X * width, height);
            }
            if (roads[i][0] === 0) {
                doRect(0, (roads[i][1] - HALFROAD) / MAX_Y * height, width, 2 * HALFROAD / MAX_Y * height);
            }
        }
        
        ctx.fillStyle = "#404040";
        for (var i = 0; i < walls.length; i++) {
            doRect((walls[i][0]) / MAX_X * width, (walls[i][1]) / MAX_Y * height, (walls[i][2] - walls[i][0]) / MAX_X * width, (walls[i][3] - walls[i][1]) / MAX_Y * height);
        }

        ctx.fillStyle = "#808080";
        for (var i = 0; i < walls.length; i++) {
            doRect((walls[i][0] + HALFROAD / 2) / MAX_X * width, (walls[i][1] + HALFROAD / 2) / MAX_Y * height, (walls[i][2] - walls[i][0] - HALFROAD) / MAX_X * width, (walls[i][3] - walls[i][1] - HALFROAD) / MAX_Y * height);
        }


        
    } else if (maptype === ICEID) {
        ctx.fillStyle = "#00FFFF";
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = "#80FFFF";
        ctx.beginPath();
        ctx.arc(width / 2, height / 2, height / 3, 0, 2 * Math.PI);
        ctx.fill();
    }
}

function realCoords(coord, axis) {
    if (axis === 0) {
        return coord / width * MAX_X;
    } else if (axis === 1) {
        return coord / height * MAX_Y;
    }
}

function doRect(x,y,dx,dy) {
    console.log(realCoords(x, 0));
    console.log(realCoords(y, 1));
    console.log(realCoords(dx, 0));
    console.log(realCoords(dy, 1));
    ctx.fillRect(realCoords(x, 0) - user.x, realCoords(y, 1) - user.y, realCoords(dx, 0), realCoords(dy, 1));
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
                mapobjects[i].x / MAX_X * width,
                mapobjects[i].y / MAX_Y * height,
                height / 20 / 100 * mapobjects[i].health
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
                    (roads[i][1] - 1.5 * HALFROAD) / MAX_X * width, 
                    0, 
                    (roads[i][1] - 1.5 * HALFROAD) / MAX_X * width + 3 * HALFROAD / MAX_X * width, 
                    height
                ];
            }
            if (roads[i][0] === 0) {
                rects[i] = [
                    0,
                    (roads[i][1] - 1.5 * HALFROAD) / MAX_Y * height,
                    width,
                    (roads[i][1] - 1.5 * HALFROAD) / MAX_Y * height + 3 * HALFROAD / MAX_Y * height         
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
        return [width / 2, height / 2, height / 3];
    }
    else return [];
}

},{"../../shared/constants.js":1}]},{},[2]);
