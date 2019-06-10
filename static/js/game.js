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
    ctx.rect(x, y, w, h);
    ctx.fill();
}
const drawCircle = (x, y, r) => {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2*Math.PI); 
    ctx.fill();
}
//basic functions
const drawPlayer = (x, y) => {
    fill("red");
    drawCircle(x, y, CONSTANTS.PLAYER_SIZE);
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

    //draw players
    for(let i = 0; i < players.length; i++){
        const player = players[i];
        drawPlayer(player.x, player.y);
        if(player.id === socket.id)
            user = player;
    }

    //draw player health
    fill("white");
    drawRect(width / 4, height - 75, width / 2, 50);

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