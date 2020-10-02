
const { Engine, 
        Render, 
        Runner, 
        World, 
        Bodies,
        Body,
        Events
    } = Matter;

const width = window.innerWidth;
const height = window.innerHeight;
const cellsH = 25;
const cellsV = 20;
const unitLengthX = width / cellsH; 
const unitLengthY = height / cellsV;


const engine = Engine.create();
engine.world.gravity.y =0;
const { world } = engine;
const render = Render.create({
    element: document.body,
    engine: engine,
    options: {
        wireframes: false,
        width,
        height,
    }
});


Render.run(render);
Runner.run(Runner.create(), engine);

// Walls
const walls = [ 
    Bodies.rectangle(width / 2, 0, width, 2, {
        isStatic: true
    }),
    Bodies.rectangle(width, height / 2, 2, height, {
        isStatic: true
    }),
    Bodies.rectangle(width / 2, height, width, 2, {
        isStatic: true
    }),
    Bodies.rectangle(0, height / 2, 2, height, {
        isStatic: true
    })
];
World.add(world, walls);
// Maze Maker
const shuffle = arr => {
    let counter = arr.length;
    while (counter > 0){
        const index = Math.floor(Math.random() * counter);
        
        counter--;
        const temp = arr[counter];
        arr[counter] = arr[index];
        arr[index]= temp;
    }
    return arr;
};

const grid = Array(cellsV)
    .fill(null)
    .map(()=> Array(cellsH).fill(false));

const verticals = Array(cellsV)
    .fill(null)
    .map(()=> Array(cellsH-1).fill(false));

const horizontals = Array(cellsV-1)
    .fill(null)
    .map(()=> Array(cellsH).fill(false));

const startRow = Math.floor(Math.random() * cellsV);
const startColumn = Math.floor(Math.random() * cellsH);

const stepThroughCell = (row, column) =>{
    //If I have visited the cell at [row,column], return
    if(grid[row][column]){
        return;
    }
    //Mark this cell as visited
    grid[row][column] = true;
    //Assmble randomly ordered list of neighbors
    const neighbors = shuffle([
        [row - 1, column, 'up'],
        [row, column + 1, 'right'],
        [row + 1, column, 'down'],
        [row, column - 1, 'left']
    ]);
    
    //For each neighbor
    for(let neighbor of neighbors){
        const [nextRow, nextColumn, direction] = neighbor;
        //See if neighbor is out of bounds
        if(nextRow < 0 || nextRow >= cellsV || nextColumn < 0 || nextColumn >= cellsH){
            continue;  // the continue key word lets you skip to next iteration of the for loop. 
        }
        //If we have visited that neighbor, continue to next neighbor.
        if(grid[nextRow][nextColumn]){
            continue;
        }
    // remove a wall from either horizontals array or verticals
        if(direction === 'left'){
            verticals[row][column - 1] = true;
        } else if(direction === 'right'){
            verticals[row][column] = true;
        } else if(direction === 'up'){
            horizontals[row - 1][column] = true;
        } else if(direction === 'down') {
            horizontals[row][column] = true;
        } 

        stepThroughCell(nextRow, nextColumn)
    }
     
    // Visit that next cell

};

stepThroughCell(startRow, startColumn);

horizontals.forEach((row, rowIndex)=>{
    row.forEach((open, columnIndex) => {
        if(open){
            return;
        }
        const wall = Bodies.rectangle(
            columnIndex * unitLengthX + unitLengthX/2, 
            rowIndex * unitLengthY + unitLengthY, 
            unitLengthX,
            5,
            {
                label: 'wall',
                isStatic: true,
                render: {
                    fillStyle: '#d6db74'
                }
            } 
         );
         World.add(world, wall);
    });
});

verticals.forEach((row, rowIndex) => {
    row.forEach((open, columnIndex) => {
        if(open){
            return
        }
        const wall = Bodies.rectangle(
            columnIndex * unitLengthX + unitLengthX,
            rowIndex * unitLengthY + unitLengthY / 2,
            5,
            unitLengthY,
            {
                label: 'wall',
                isStatic: true,
                render: {
                    fillStyle: '#d6db74'
                }
            } 
        );
        World.add(world, wall);
    });
});

//Goal

const goal = Bodies.rectangle(
    width - unitLengthX / 2,
    height - unitLengthY / 2, 
    unitLengthX * .7,
    unitLengthY * .7,{
        label: 'goal',
        isStatic: true,
        render: {
            fillStyle: "#58edd7"
        }
    } 
);

World.add(world, goal);

//Ball
const ballRadius = Math.min(unitLengthX,unitLengthY) / 4;

const ball = Bodies.circle(
    unitLengthX / 2,
    unitLengthY / 2,
    ballRadius,
    {
        label: 'ball',
        render: {
            fillStyle: '#c587e0'
        }
    }
);

World.add(world, ball);

document.addEventListener('keydown', event => {
    const { x, y } = ball.velocity;
    if(event.keyCode === 87) {
        Body.setVelocity(ball, { x, y:y - 3});
    } else if(event.keyCode === 68) {
        Body.setVelocity(ball, { x: x + 3, y});
    } else if(event.keyCode === 83) {
        Body.setVelocity(ball, { x, y:y + 3});
    } else if(event.keyCode === 65) {
        Body.setVelocity(ball, { x: x - 3, y});
    } 
});

let [ms, s, m]  = [0,0,0];
let timer;
function run(){
    score.textContent = getTimer();
    ms++; 
    if(ms == 100){
        ms = 0;
        s++;
    }
    if(s == 60){
        s = 0;
        m++;
    }
}
function start() {  
    timer = setInterval(run , 10);
}

function pause (){
    clearInterval(timer);
    timer = false;
}
function getTimer(){
    return `${m}m:${s}s:${ms}ms`;
}

// Win condition
const score = document.querySelector('.score');

Events.on(engine, 'collisionStart', event => {
    event.pairs.forEach((collision)=>{
        const labels = ['ball', 'goal'];
        if(labels.includes(collision.bodyA.label) && labels.includes(collision.bodyB.label)){
            pause();
            //score.value = getTimer();
            document.querySelector('.winner').classList.remove('hidden');
            score.classList.remove('hidden');
            world.gravity.y = 1;
            world.bodies.forEach(body => {
                if(body.label === 'wall') {
                    Body.setStatic(body, false);

                }
            })
        }
    });
});

alert("Use WASD to move the ball to the bottom right goal to win!");
start();