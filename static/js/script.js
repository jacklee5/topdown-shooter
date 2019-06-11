const MAX_TREES = 20;
const MAX_X = 1920;
const MAX_Y = 1080;
const FORESTID = 0;
const CITYID = 1;
const ROOFID = 2;
const ICEID = 3;
const HALFROAD = (MAX_X / 20);

var notholes = [];
var walls = [];
var maptype;
var mapobjects = [];
var hazards = [];
var roads = [];
var canvas = document.getElementById("game");
var ctx = canvas.getContext("2d");


let HEIGHT = window.innerHeight;
let WIDTH = window.innerWidth;
canvas.style.height = HEIGHT + "px";
canvas.style.width = WIDTH + "px";
canvas.height = HEIGHT;
canvas.width = WIDTH;

const tree = {
    health: 100
}

const car = {
    speed: 100
}

const snake = {
    health: 25
}

function createMap() {
    maptype = Math.floor((Math.random() * 4));
    if (maptype === FORESTID) {
        for (var i = 0; i < MAX_TREES; i++) {
            mapobjects.push(tree);
            mapobjects[i].x = (Math.random() * MAX_X);
            mapobjects[i].y = (Math.random() * MAX_Y);
        }
    } else if (maptype === CITYID) {
        var vert1 = (Math.random() * MAX_X / 7 + 2 * MAX_X / 7);
    	var vert2 = (Math.random() * MAX_X / 7 + 4 * MAX_X / 7);
    	var vert3 = (Math.random() * MAX_X / 7 + 6 * MAX_X / 7);
    	var horz1 = (Math.random() * MAX_Y / 5 + 2 * MAX_X / 7);
    	var horz2 = (Math.random() * MAX_Y / 5 + 4 * MAX_X / 7);
    	roads.push([1, vert1], [1, vert2], [1, vert3], [0, horz1], [0, horz2]);
    	walls.push(
            [0,                     0                       ,  vert1 - 2 * HALFROAD,   horz1 - 2 * HALFROAD ],
            [vert1 + 2 * HALFROAD,  0                       ,  vert2 - 2 * HALFROAD,   horz1 - 2 * HALFROAD ],
            [vert2 + 2 * HALFROAD,  0                       ,  vert3 - 2 * HALFROAD,   horz1 - 2 * HALFROAD ],
            [vert3 + 2 * HALFROAD,  0                       ,  MAX_X               ,   horz1 - 2 * HALFROAD ],
            [0,                     horz1 + 2 * HALFROAD    ,  vert1 - 2 * HALFROAD,   horz2 - 2 * HALFROAD ],
            [vert1 + 2 * HALFROAD,  horz1 + 2 * HALFROAD    ,  vert2 - 2 * HALFROAD,   horz2 - 2 * HALFROAD ],
            [vert2 + 2 * HALFROAD,  horz1 + 2 * HALFROAD    ,  vert3 - 2 * HALFROAD,   horz2 - 2 * HALFROAD ],
            [vert3 + 2 * HALFROAD,  horz1 + 2 * HALFROAD    ,  MAX_X               ,   horz2 - 2 * HALFROAD ],
            [0,                     horz2 + 2 * HALFROAD    ,  vert1 - 2 * HALFROAD,   MAX_Y                ],
            [vert1 + 2 * HALFROAD,  horz2 + 2 * HALFROAD    ,  vert2 - 2 * HALFROAD,   MAX_Y                ],
            [vert2 + 2 * HALFROAD,  horz2 + 2 * HALFROAD    ,  vert3 - 2 * HALFROAD,   MAX_Y                ],
            [vert3 + 2 * HALFROAD,  horz2 + 2 * HALFROAD    ,  MAX_X               ,   MAX_Y                ]
        );
    } else if (maptype === ROOFID) {
        var vert1 = (Math.random() * MAX_X / 7 + 2 * MAX_X / 7);
        var vert2 = (Math.random() * MAX_X / 7 + 4 * MAX_X / 7);
        var vert3 = (Math.random() * MAX_X / 7 + 6 * MAX_X / 7);
        var horz1 = (Math.random() * MAX_Y / 5 + 2 * MAX_X / 7);
        var horz2 = (Math.random() * MAX_Y / 5 + 4 * MAX_X / 7);
        roads.push([1, vert1], [1, vert2], [1, vert3], [0, horz1], [0, horz2]);
        notholes.push(
            [0,                     0                       ,  vert1 - 2 * HALFROAD,   horz1 - 2 * HALFROAD ],
            [vert1 + 2 * HALFROAD,  0                       ,  vert2 - 2 * HALFROAD,   horz1 - 2 * HALFROAD ],
            [vert2 + 2 * HALFROAD,  0                       ,  vert3 - 2 * HALFROAD,   horz1 - 2 * HALFROAD ],
            [vert3 + 2 * HALFROAD,  0                       ,  MAX_X               ,   horz1 - 2 * HALFROAD ],
            [0,                     horz1 + 2 * HALFROAD    ,  vert1 - 2 * HALFROAD,   horz2 - 2 * HALFROAD ],
            [vert1 + 2 * HALFROAD,  horz1 + 2 * HALFROAD    ,  vert2 - 2 * HALFROAD,   horz2 - 2 * HALFROAD ],
            [vert2 + 2 * HALFROAD,  horz1 + 2 * HALFROAD    ,  vert3 - 2 * HALFROAD,   horz2 - 2 * HALFROAD ],
            [vert3 + 2 * HALFROAD,  horz1 + 2 * HALFROAD    ,  MAX_X               ,   horz2 - 2 * HALFROAD ],
            [0,                     horz2 + 2 * HALFROAD    ,  vert1 - 2 * HALFROAD,   MAX_Y                ],
            [vert1 + 2 * HALFROAD,  horz2 + 2 * HALFROAD    ,  vert2 - 2 * HALFROAD,   MAX_Y                ],
            [vert2 + 2 * HALFROAD,  horz2 + 2 * HALFROAD    ,  vert3 - 2 * HALFROAD,   MAX_Y                ],
            [vert3 + 2 * HALFROAD,  horz2 + 2 * HALFROAD    ,  MAX_X               ,   MAX_Y                ]
        );
    } else if (maptype === ICEID) {
    }
    console.log(maptype);
}

function drawMap() {
    console.log("big");
    ctx.fillStyle = "#00FF00";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    console.log("pig");
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
    if (maptype == FORESTID) {
        return [];
    } else if (maptype == CITYID) {
        return walls;
    } else if (maptype == ROOFID) {
        return [];
    } else if (maptype == ICEID) {
        return [];
    }
}

// returns all circular areas where players cannot stand. first array is index of tree.
// second array is info for each tree, 0 is x, 1 is y, 3 is radius.
function circleBoundaries() {
    if (maptype == FORESTID) {
        circles = [];
        for (var i = 0; i < mapobjects.length; i++) {
            circles[i] = [
                mapobjects[i].x / MAX_X * WIDTH,
                mapobjects[i].y / MAX_Y * HEIGHT,
                HEIGHT / 20 / 100 * mapobjects[i].health
            ];
        }
    } else if (maptype == CITYID) {
        return [];
    } else if (maptype == ROOFID) {
        return [];
    } else if (maptype == ICEID) {
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