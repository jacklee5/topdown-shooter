(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
const CONSTANTS = { 
    MOVEMENT_SPEED: 200,
    PLAYER_SIZE: 15,
    MAX_TREES: 50,
	MAX_X: 1920,
	MAX_Y: 1080,
	FORESTID: 0,
	CITYID: 1,
	ICEID: 2,
    MAP_NAMES: ["Forest", "City", "Iceberg"],
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
    BULLET_DURATION: 360,
    GAME_LENGTH: 5 * 60 * 60,
    //NOTE: reload time is in seconds!
    //enum for weapons, similar to below
    WEAPONS: {
        FISTS: 0,
        0: {
            damage: 10
        },
        PISTOL: 1,
        1: {
            damage: 15,
            speed: 2000,
            cooldown: 5,
            length: 20,
            magazine: 15,
            spread: 15,
            reload: 1
        },
        AR: 2,
        2: {
            damage: 12,
            speed: 1800,
            cooldown: 5,
            auto: true,
            length: 34,
            magazine: 30,
            spread: 8,
            reload: 2
        }
    },
    //enum for animations and the corresponding numbers encode values for the animation
    ANIMATIONS: {
        PUNCH_LEFT: 0,
        0: {
            length: 15
        },
        PUNCH_RIGHT: 1,
        1: {
            length: 15
        }
    }, 
    GAME_MODES: {
        DEATHMATCH: 0
    },
    MODE_NAMES: ["Deathmatch"],
    ROLES: {
        PLAYER: 1,
        BULLET: 2,
        BORDER: 3
    },
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
        document.getElementById("map-name").textContent = CONSTANTS.MAP_NAMES[maptype];
    }
);


// require("script.js");
// drawMap();

//page switching stuff
const PAGES = {
    HOME: 0,
    GAME: 1,
    GAMEOVER: 2
}
let currentPage = PAGES.HOME;
let inGame = false;
const changePage = (id) => {
    const pages = document.getElementsByClassName("page");
    for(let i = 0; i < pages.length; i++){
        pages[i].style.display = "none";
    }
    pages[id].style.display = "block";
    currentPage = id;
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
    VIEW_STATS: 9,
    RELOAD: 82,
}
const keyStates = {};
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
let players = [];
let bullets = [];
let currentWeapon;
let timeRemaining;
//which player is the user
let user = {inventory: []};
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
    fill("#ffcd94");

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(r);
    
    //body
    drawCircle(0, 0, CONSTANTS.PLAYER_SIZE);

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
    if(player.weapon !== CONSTANTS.WEAPONS.FISTS){
        fill("black");
        drawRect(-2 , -CONSTANTS.PLAYER_SIZE - 2, 4, -CONSTANTS.WEAPONS[player.weapon].length - 2)
    }

    ctx.restore();

    fill("black");
    ctx.font = '12px sans-serif';
    ctx.textAlign = "center";
    ctx.fillText(player.name, x, y + CONSTANTS.PLAYER_SIZE + 16);  
}

const drawBullet = (bullet) => {
    let x = bullet.x - user.x + width / 2;
    let y = bullet.y - user.y + height / 2;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(bullet.rotation);

    const trailLength = 45;
    for(let i = 0; i < trailLength; i++){
        fill(`rgba(255,255,255,${0.8 - (i)/trailLength})`)
        drawCircle(-i, 0, CONSTANTS.BULLET_SIZE - (i * (CONSTANTS.BULLET_SIZE / 2)) / trailLength) + CONSTANTS.BULLET_SIZE / 2;
    }
    
    
    fill("rgba(255,255,255,0.8)");
    drawCircle(0, 0, CONSTANTS.BULLET_SIZE);

    ctx.restore();
}

//returns true if the inventories are the same
const compareInventories = (inv1, inv2) => {
    if(inv1.length !== inv2.length) return false;
    for(let i = 0; i < inv1.length; i++){
        if(inv1[i].weapon !== inv2[i].weapon && inv1[i].magazine)
            return false;
    }
    return true;
}

//get index of current weapon
const getIndex = () => {
    const inv = user.inventory;
    for(let i = 0; i < inv.length; i++){
        console.log(user.weapon);
        console.log(inv);
        if(inv[i].weapon === user.weapon)
            return i;
    }
    return -1;
}

//highlight selected weapon
const showWeapon = () => {
    const els = document.getElementsByClassName("weapon");
    for(let i = 0; i < els.length; i++){
        els[i].className = "weapon";
    }
    if(els[getIndex()])
        els[getIndex()].className += " active-weapon"
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

    //player loop thing
    //find out which person is the user
    for(let i = 0; i < players.length; i++){
        const player = players[i];
        const old = user.inventory;
        if(player.id === socket.id)
            user = player;
        if(!compareInventories(user.inventory, old)){
            const inv = user.inventory;
            const el = document.getElementById("weapons");
            el.innerHTML = "";
            for(let i = 0; i < inv.length; i++){
                el.innerHTML += `
                <div class = "weapon">
                    <img src = "/static/img/weapon${inv[i].weapon}.svg" width = "48">
                </div>
                `
            }
        }
    }

    if(user)
        drawBackground();

    //draw bullets
    for(let i = 0; i < bullets.length; i++){
        drawBullet(bullets[i]);
    }

    //draw map
    if(user)
        drawMap();

    if(user)
        showWeapon();

    //draw players
    if(user){
        for(let i = 0; i < players.length; i++){
            const player = players[i];
            drawPlayer(player);
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

    //update time
    if(timeRemaining){
        const minutes = Math.floor(timeRemaining / 60);
        const seconds = Math.floor(timeRemaining % 60) + "";
        document.getElementById("time-remaining").textContent = `${minutes}:${seconds.padStart(2, "0")}`
    }

    //update ammo
    if(user)
        document.getElementById("ammo-amount").textContent = user.magazine;

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
    if(e.keyCode === KEYS.RELOAD){
        socket.emit("reload");
        const el = document.getElementById("message");
        el.style.display = "block";
        el.textContent = "reloading...";
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
    if(currentPage === PAGES.GAME)
        socket.emit("fire");
});
window.addEventListener("mouseup", () => {
    if(currentPage === PAGES.GAME)
        socket.emit("release")
});
window.addEventListener("wheel", (e) => {
    if(e.deltaY < 0){
        socket.emit("previous weapon");
    }else{
        socket.emit("next weapon");
    }
});

window.addEventListener("keydown", e => {
    keyStates[e.keyCode] = true;
    if(e.keyCode >= 49 && e.keyCode <= 58){
        socket.emit("switch weapon", e.keyCode - 49);
    }
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

document.getElementById("respawn-button").addEventListener("click", () => {
    socket.emit("respawn");
    changePage(PAGES.GAME);
})

//listen for state change
socket.on("state", state => {
    players = state.players;
    bullets = state.bullets;
    timeRemaining = state.timeRemaining;
});
socket.on("leaderboard", data => {
    const el = document.getElementById("ranks");
    el.innerHTML = `
    <tr>
        <th>Rank</th>
        <th>Name</th>
        <th span = "score-type">Kills</th>
    </tr>`;
    for(let i = 0; i < data.length; i++){
        el.innerHTML += `<tr>
            <td>${i + 1}</td>
            <td>${data[i].name}</td>
            <td>${data[i].score}</td>
        </tr>`
    }
});
socket.on("death", () => {
    
    changePage(PAGES.GAMEOVER);
    document.getElementById("kill_count").textContent = user.kills;
    
});
socket.on("game over", () => {
    document.getElementById("game-info").style.display = "block";
});
socket.on("done reloading", () => {
    document.getElementById("message").style.display = "none";
})

function drawBackground(){
    ctx.fillStyle = "#008000";
    ctx.fillRect(0, 0, width, height);
    if(maptype === CITYID){
        ctx.fillStyle = "#A0A0A0";
        for (var i = 0; i < roads.length; i++) {
            if (roads[i][0] === 1) {
                doRect((roads[i][1] - 1.5 * HALFROAD), 0, 3 * HALFROAD, MAX_Y);
            }
            if (roads[i][0] === 0) {
                doRect(0, (roads[i][1] - 1.5 * HALFROAD), MAX_X, 3 * HALFROAD);
            }
        }
        ctx.fillStyle = "#808080";
        for (var i = 0; i < roads.length; i++) {
            if (roads[i][0] === 1) {
                doRect((roads[i][1] - HALFROAD), 0, 2 * HALFROAD, MAX_Y);
            }
            if (roads[i][0] === 0) {
                doRect(0, (roads[i][1] - HALFROAD), MAX_X, 2 * HALFROAD);
            }
        }
    }else if(maptype === ICEID){
        ctx.fillStyle = "#00FFFF";
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = "#80FFFF";
        ctx.beginPath();
        ctx.arc(MAX_X / 2 - user.x + width / 2, MAX_Y / 2 - user.y + height / 2, MAX_X / 3, 0, 2 * Math.PI);
        ctx.fill();
    }
}

function drawMap() {
    if (maptype === FORESTID) {
        ctx.fillStyle = "#FF8000";
        for (var i = 0; i < mapobjects.length; i++) {
            ctx.beginPath();
            ctx.arc(mapobjects[i].x + width / 2 - user.x, mapobjects[i].y + height / 2 - user.y, mapobjects[i].health / 5 + 5, 0, 2 * Math.PI);
            ctx.fill();
        }
    } else if (maptype === CITYID) {
        ctx.fillStyle = "#404040";
        for (var i = 0; i < walls.length; i++) {
            doRect((walls[i][0]), (walls[i][1]), (walls[i][2] - walls[i][0]), (walls[i][3] - walls[i][1]));
        }

        ctx.fillStyle = "#808080";
        for (var i = 0; i < walls.length; i++) {
            doRect((walls[i][0] + HALFROAD / 2), (walls[i][1] + HALFROAD / 2), (walls[i][2] - walls[i][0] - HALFROAD), (walls[i][3] - walls[i][1] - HALFROAD));
        }

        
    } 
    // else if (maptype === ROOFID) {
    //     ctx.fillStyle = "#A0A0A0";
    //     for (var i = 0; i < roads.length; i++) {
    //         if (roads[i][0] === 1) {
    //             doRect((roads[i][1] - 1.5 * HALFROAD), 0, 3 * HALFROAD, MAX_Y);
    //         }
    //         if (roads[i][0] === 0) {
    //             doRect(0, (roads[i][1] - 1.5 * HALFROAD), MAX_X, 3 * HALFROAD);
    //         }
    //     }

    //     ctx.fillStyle = "#808080";
    //     for (var i = 0; i < roads.length; i++) {
    //         if (roads[i][0] === 1) {
    //             doRect((roads[i][1] - HALFROAD), 0, 2 * HALFROAD, MAX_Y);
    //         }
    //         if (roads[i][0] === 0) {
    //             doRect(0, (roads[i][1] - HALFROAD), MAX_X, 2 * HALFROAD);
    //         }
    //     }

    //     ctx.fillStyle = "#404040";
    //     for (var i = 0; i < walls.length; i++) {
    //         doRect((walls[i][0]), (walls[i][1]), (walls[i][2] - walls[i][0]), (walls[i][3] - walls[i][1]));
    //     }

    //     ctx.fillStyle = "#808080";
    //     for (var i = 0; i < walls.length; i++) {
    //         doRect((walls[i][0] + HALFROAD / 2), (walls[i][1] + HALFROAD / 2), (walls[i][2] - walls[i][0] - HALFROAD), (walls[i][3] - walls[i][1] - HALFROAD));
    //     }

    // } 
}

function realCoords(coord, axis) {
    if (axis === 0) {
        return coord;
    } else if (axis === 1) {
        return coord;
    }
}

function doRect(x,y,dx,dy) {
    ctx.fillRect(realCoords(x, 0) - user.x + width / 2, realCoords(y, 1) - user.y + height / 2, realCoords(dx, 0), realCoords(dy, 1));
}



},{"../../shared/constants.js":1}]},{},[2]);
