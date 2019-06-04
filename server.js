const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

app.set('view engine', 'ejs');

app.use("/static", express.static("static"));

app.get('/', function (req, res) {
    res.render('index.ejs');
});

//load classes
const Game = require("./server/Game");
const Player = require("./server/Player");

const games = {};

//generate random id
const getId = () => {
    return Math.random().toString(36).substr(2, 5);
}

//creates a game
const createGame = () => {
    const id = getId();
    const game = new Game(id);
    games[id] = game;
    return game;
}

io.on('connection', function (socket) {
    console.log('[DEBUG] a user connected');
    socket.on("new player", (username) => {
        const player = new Player(username);
        let roomId;

        for(let i in games){
            if(games[i].isJoinable()){
                games[i].addPlayer(player)
                roomId = i;
                break;
            }
        }

        if(!roomId){
            const game = createGame();
            game.addPlayer(player);
            roomId = game.id;
        }

        console.log(`[DEBUG] user ${username} in joined room ${roomId}`)
        
        socket.emit("game found", roomId)
    })
});

http.listen(3000, function () {
    console.log('listening on *:3000');
});