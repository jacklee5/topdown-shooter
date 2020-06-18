const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

app.set('view engine', 'ejs');

app.use("/static", express.static("static"));
app.use("/shared", express.static("shared"));

app.get('/', function (req, res) {
    res.render('index.ejs');
});

//load classes
const Game = require("./server/Game");
const Player = require("./server/Player");

const games = {};
const players = {};

//generate random id
const getId = () => {
    return Math.random().toString(36).substr(2, 5);
}

//creates a game
const createGame = () => {
    const id = getId();
    const game = new Game(id, io);
    games[id] = game;
    return game;
}

io.on('connection', function (socket) {
    console.log('[DEBUG] a user connected');
    socket.on("new player", (username) => {
        if(username.length > 15) return;
        const player = new Player(username, socket.id);
        player.socket = socket;
        let roomId;

        for(let i in games){
            if(games[i].isJoinable()){
                roomId = i;
                break;
            }
        }

        if(!roomId){
            const game = createGame();
            roomId = game.id;
        }

        socket.join(roomId);
        games[roomId].addPlayer(player);
        socket.emit("map", games[roomId].map);
        socket.emit("game mode", games[roomId].gameType);
        socket.emit("flag update", games[roomId].getFlagData())
        players[socket.id] = player;

        console.log(`[DEBUG] user ${username} in joined room ${roomId}`)
        
        socket.emit("game found", roomId);
    });
    socket.on("movement", movement => {
        const player = players[socket.id];
        if(!player) return;
        player.movement = movement;
    });
    socket.on("disconnect", () => {
        const player = players[socket.id];
        if(!player) return;
        console.log(`[DEBUG] user ${player.name} disconnected`);
        const game = player.game;
        player.leaveGame();
        if(!game) return;
        if(game.players.length === 0)
            delete games[game.id];
        
    })
    socket.on("fire", () => {
        const player = players[socket.id];
        if(!player) return;
        player.fire();
    });
    socket.on("release", () => {
        const player = players[socket.id];
        if(!player) return;
        player.release();
    });
    socket.on("respawn", () => {
        const player = players[socket.id];
        if(!player) return;
        player.respawn();
    })
    socket.on("rotation", angle => {
        const player = players[socket.id];
        if(!player) return;
        player.rotation = angle;
    });
    socket.on("reload", () => {
        const player = players[socket.id];
        if(!player) return;
        player.reload();
    });
    socket.on("next weapon", () => {
        const player = players[socket.id];
        if(!player) return;
        player.nextWeapon();
    });
    socket.on("previous weapon", () => {
        const player = players[socket.id];
        if(!player) return;
        player.previousWeapon();
    });
    socket.on("switch weapon", (x) => {
        const player = players[socket.id];
        if(!player) return;
        player.switchWeapon(x);
    });
    socket.on("game over", () => {
        console.log("game over")
    })
});
//main loop
setInterval(() => {
    for(let i in games){
        if(games[i].finished) {
            delete games[i];
            continue;
        }
        games[i].tick(io);
        io.in(i).emit("state", games[i].toObject());
    }
}, 1000 / 60)

// http.listen(80, function () {
//     console.log('listening on *:80');
// });

http.listen(7777, "0.0.0.0", function () {
    console.log('listening on *:80');
});
