const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const font = "16pt Comic Sans MS";

const startTime = new Date().getTime() / 1000
let currentTime = (new Date().getTime() / 1000) - startTime;
let foodTime = currentTime + 5;

let virusUnleashed = false;

class vector2 {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

class object {
    constructor(position, width, type) {
        this.position = position;
        this.scale = new vector2(width, 16);
        this.type = type;
        this.infected = false;
        this.dead = false;
        this.color = "white";
        this.updateType(type);
    }

    //Render the object to the canvas
    draw() {
        ctx.font = font;
        ctx.fillStyle = this.color;
        ctx.textAlign = "center";
        if(!this.dead)
            ctx.fillText(this.type, this.position.x, this.position.y, this.width);
        else
            ctx.fillText("DEAD", this.position.x, this.position.y, this.width);

    }

    updateType(newType) {
        this.type = newType;
        if(!this.infected && !this.dead) {
            switch(newType) {
                case "MAN":
                    this.color = "deepskyblue";
                    break;
                case "WOMAN":
                    this.color = "hotpink";
                    break;
                case "FOOD":
                    this.color = "red";
                    break;
                default:
                    break;
            }
        } else if(this.infected) {
            this.color = "green";
        } else if(this.dead) {
            this.color = "grey";
        }
    }

    update() {
        this.draw();
    }
}

class human extends object {
    constructor(position, width, type) {
        super(position, width);

        this.velocity = new vector2(0,0);
        this.speed = 1;
        this.heading = 0;
        this.age = 0;
        this.hunger = 25;
        this.canReproduce = false;
        this.reproduceTime = currentTime + 5;

        this.updateType(type);

        this.decisionTime = 0;

        this.ageOfDeath = 85 + Math.floor(Math.random() * 25);
        this.lastTick = 0;

        this.decayAlpha = 255;

    }
    updatePosition() {
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;
    }

    checkCollisionList() {
        for(let i = 0; i < food.length; i++){
            if(this.checkCollision(food[i])) {
                food.splice(i,1);
                this.hunger += 20;

                if(this.hunger > 100)
                    this.hunger = 100;
            }
        }
        if(this.type == "MAN") {
            for(let i = 0; i < women.length; i++) {
                if(this.checkCollision(women[i]) && women[i].canReproduce) {
                    children.push(new human(new vector2(this.position.x, this.position.y), 68, "CHILD"));
                    console.log("A CHILD was born")
                    women[i].canReproduce = false;
                    women[i].reproduceTime = currentTime + 15;
                }
            }
        }
        if(this.infected) {
            for(let i = 0; i < men.length; i++) {
                if(this.checkCollision(men[i]))
                    men[i].setInfected();
            }

            for(let i = 0; i < women.length; i++) {
                if(this.checkCollision(women[i]))
                    women[i].setInfected();
            }

            for(let i = 0; i < children.length; i++) {
                if(this.checkCollision(children[i]))
                    children[i].setInfected();
            }
        }
    }

    checkCollision(other) {
        if(this.position.x - (this.scale.x / 2) < other.position.x + (other.scale.x / 2)
            && this.position.x + this.scale.x / 2 > other.position.x - (other.scale.x / 2)
            && this.position.y - this.scale.y / 2 < other.position.y + (other.scale.y / 2)
            && this.position.y + this.scale.y / 2 > other.position.y - (other.scale.y / 2))
            {
                return true;
            }
    }

    makeDecision() {
        let decisionDelay = Math.random() * 8 + 2;
        this.decisionTime = currentTime + decisionDelay;

        // if(this.hunger < 50 && food.length > 0)
        //     this.moveTowardsFood();
        // else
            this.decideNewDirection();
    }

    moveTowardsFood() {
        //let closestFood = this.findNearestFood();
        let randomFood = food[Math.floor(Math.random() * food.length)];
        this.heading = Math.atan2((randomFood.position.y - this.position.y), (randomFood.position.x - this.position.x));
        this.setNewVelocity();
    }

    decideNewDirection() {
        this.heading = Math.floor(Math.random() * 360);
        this.setNewVelocity();
    }

    setNewVelocity() {
        this.velocity.x = this.speed * Math.sin(this.heading);
        this.velocity.y = this.speed * Math.cos(this.heading);
    }

    edgeBounce() {
        if(this.position.x + (this.scale.x / 2) > canvas.clientWidth || this.position.x - (this.scale.x / 2) < 0)
            this.velocity.x = -this.velocity.x;

        if(this.position.y + (this.scale.y / 2) > canvas.clientHeight || this.position.y - (this.scale.y) < 0)
            this.velocity.y = -this.velocity.y;
    }

    tick() {
        this.lastTick = currentTime;
        if(!this.infected) {
            this.age++;
            this.hunger--;
        } else {
            this.age += 2;
            this.hunger -= 2;
        }
    }

    die(cause) {
        if(this.infected)
            cause = "infection";
        console.log(`${this.type} - ${this.age} died of ${cause}`)
        this.dead = true;
        this.velocity.x = this.velocity.y = 0;
        this.updateType(this.type);
        this.canReproduce = false;
        this.width = 60;
        limbo.push(this);
    }

    decay() {
        this.lastTick = currentTime;
        this.decayAlpha -= 10;
        this.color = `rgba(128,128,128,${this.decayAlpha})`;
    }

    setInfected() {
        this.infected = true;
        this.color = "green";
    }

    update() {
        if(!this.dead) {
            if(this.decisionTime < currentTime)
                this.makeDecision();
            if(this.ageOfDeath <= this.age)
                this.die("old age");
            if(this.hunger <= 0)
                this.die("hunger");
            if(currentTime > this.lastTick)
                this.tick();
            if(this.type == "CHILD" && this.age > 16) {
                if(Math.random() < 0.5) {
                    this.updateType("MAN");
                    this.scale.x = 46;
                    let index = children.indexOf(this);
                    men.push(children[index]);
                    adults.push(children[index]);
                    return;
                } else {
                    this.updateType("WOMAN");
                    this.scale.x = 80;
                    this.canReproduce = true;
                    let index = children.indexOf(this);
                    women.push(children[index]);
                    adults.push(children[index]);
                    return;
                }
            }
            if(this.type == "WOMAN" && this.canReproduce == false && this.reproduceTime < currentTime)
                this.canReproduce = true;

            this.updatePosition();
            this.checkCollisionList();
            this.edgeBounce();
        } else {
            if(currentTime > this.lastTick && this.decayAlpha > 0)
                this.decay();
        }
        this.draw();
    }
}

let men = [];
let women = [];
let children = [];
let adults = [];
let limbo = []
let dead = [];
let food = [];

const randomPosition = () => {
    let x = Math.random() * (canvas.clientWidth - 40) + 20;
    let y = Math.random() * (canvas.clientHeight - 40) + 20;
    return new vector2(x, y);
}

for(let i = 0; i < 5; i++){
    men.push(new human(randomPosition(), 46, "MAN"));
}

for(let i = 0; i < 5; i++){
    women.push(new human(randomPosition(), 80, "WOMAN"));
}

const spawnNewFood = (count) => {
    for(let i = 0; i < count; i++)
        food.push(new object(randomPosition(), 60, "FOOD"))
}

const infectSomeone = () => {
    if(Math.random() > 0.5) {
        let index = Math.floor(Math.random() * men.length);
        men[index].setInfected();
    } else {
        let index = Math.floor(Math.random() * women.length);
        women[index].setInfected();
    }
}

const update = () => {
    ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight); //Clear the canvas ready for the next draw loop
    for(let i = 0; i < men.length; i++) {
        men[i].update();
    }

    for(let i = 0; i < women.length; i++) {
        women[i].update();
    }

    for(let i = 0; i < children.length; i++) {
        children[i].update();
    }

    for(let i = 0; i < dead.length; i++) {
        dead[i].update();
    }

    if(adults.length > 0) {
        for(let i = 0; i < adults.length; i++) {
            let index = children.indexOf(adults[i]);
            children.splice(index, 1);
        }
        adults = [];
    }

    if(limbo.length > 0) {
        console.log(limbo);
        for(let i = 0; i < limbo.length; i++) {
            if(limbo[i].type == "MAN") {
                men.splice(men.indexOf(limbo[i]), 1);
            } else if (limbo[i].type == "WOMAN") {
                women.splice(women.indexOf(limbo[i]), 1);
            }
            dead.push(limbo[i]);
        }
        limbo = [];
    }

    for(let i = 0; i < food.length; i++) {
        food[i].update();
    }

    if(currentTime > foodTime && food.length < 15) {
        foodTime = currentTime + 5;
        spawnNewFood(5);
    }

    if(currentTime > 120 && !virusUnleashed) {
        virusUnleashed = true;
        infectSomeone();
        console.log("A deadly virus has been unleashed!");
    }

    currentTime = Math.floor(((new Date().getTime() / 1000) - startTime));
    //console.log(currentTime);
    requestAnimationFrame(update); //Repeat the function at a fixed frame rate
}

update(); //Initiate the main loop function to begin the simulation