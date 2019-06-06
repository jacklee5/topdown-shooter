const CONSTANTS = require("/shared/constants");
const socket = io();

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
    RIGHT: 39,
    LEFT: 37,
    UP: 38,
    DOWN: 40
}
const keyStates = {};
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
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
    ctx.arc(x, y, CONSTANTS.PLAYER_SIZE, 0, 2*Math.PI); 
    ctx.fill();
}
//basic functions
const drawPlayer = (x, y) => {
    fill("red");
    drawCircle(x, y, 15);
}

let x = 0, y = 0;
//draw loop
const draw = () => {
    if(!inGame) return;
    console.log("gay")

    //handle controls
    const movement = {};
    if(keyStates[KEYS.UP])
        movement.up = true;
    if(keyStates[KEYS.DOWN])
        movement.down = true;
    if(keyStates[KEYS.LEFT])
        movement.left = true;
    if(keyStates[KEYS.RIGHT])
        movement.right = true;

    //draw background
    fill("green");
    drawRect(0, 0, width, height);

    //send data to server
    socket.emit("movement", movement);

    requestAnimationFrame(draw);
}
requestAnimationFrame(draw);

//keyboard events
window.addEventListener("keydown", e => {
    keyStates[e.keyCode] = true;
});
window.addEventListener("keyup", e => {
    keyStates[e.keyCode] = false;
});

//dont make canvas stupid
window.addEventListener("resize", () => {
    width = window.innerHeight;
    height = window.innerWidth;
    canvas.style.height = height + "px";
    canvas.style.width = width + "px";
    canvas.height = height;
    canvas.width = width;
});