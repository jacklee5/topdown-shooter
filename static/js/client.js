const socket = io();
const CONSTANTS = require("../../shared/constants.js")
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
        drawRect(-2, -CONSTANTS.PLAYER_SIZE, 4, -18);
    }

    ctx.restore();
}

const drawBullet = (bullet) => {
    if(!bullet.exists) return;
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
    fill("green");
    drawRect(0, 0, width, height);

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
});
window.addEventListener("keyup", e => {
    keyStates[e.keyCode] = false;
});
window.addEventListener("mousedown", () => {
    socket.emit("fire");
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
})