class Ghost {
    constructor(
    x, y, width, height, speed,
    imageX, imageY, imageWidth, imageHeight, range
) {
    // מציאת בלוק חוקי לשיגור
    let spawnX = 0, spawnY = 0;
    const freeBlocks = [];

    // יוצרים רשימה של כל הבלוקים החופשיים במפה
    for (let row = 0; row < map.length; row++) {
        for (let col = 0; col < map[row].length; col++) {
            if (map[row][col] !== 1) freeBlocks.push({x: col, y: row});
        }
    }

    // בחר בלוק חוקי אקראי
    const spawnBlock = freeBlocks[Math.floor(Math.random() * freeBlocks.length)];
    spawnX = spawnBlock.x;
    spawnY = spawnBlock.y;

    this.x = spawnX * oneBlockSize;
    this.y = spawnY * oneBlockSize;
    this.width = width;
    this.height = height;
    this.speed = speed;
    this.direction = DIRECTION_RIGHT;
    this.imageX = imageX;
    this.imageY = imageY;
    this.imageWidth = imageWidth;
    this.imageHeight = imageHeight;
    this.range = range;
    this.randomTargetIndex = parseInt(Math.random() * 4);
    this.target = randomTargetsForGhosts[this.randomTargetIndex];

    setInterval(() => this.changeRandomDirection(), 10000);
}


    isInRange() {
        let xDistance = Math.abs(pacman.getMapX() - this.getMapX());
        let yDistance = Math.abs(pacman.getMapY() - this.getMapY());
        return Math.sqrt(xDistance ** 2 + yDistance ** 2) <= this.range;
    }

    changeRandomDirection() {
        this.randomTargetIndex = (this.randomTargetIndex + 1) % 4;
    }

    moveProcess() {
        if (this.isInRange()) {
            this.target = pacman;
        } else {
            this.target = randomTargetsForGhosts[this.randomTargetIndex];
        }

        this.changeDirectionIfPossible();
        this.moveForwards();

        if (this.checkCollisions()) {
            this.moveBackwards();
        }
    }

    moveBackwards() {
        switch (this.direction) {
            case DIRECTION_RIGHT: this.x -= this.speed; break;
            case DIRECTION_UP:    this.y += this.speed; break;
            case DIRECTION_LEFT:  this.x += this.speed; break;
            case DIRECTION_BOTTOM:this.y -= this.speed; break;
        }
    }

    moveForwards() {
        switch (this.direction) {
            case DIRECTION_RIGHT: this.x += this.speed; break;
            case DIRECTION_UP:    this.y -= this.speed; break;
            case DIRECTION_LEFT:  this.x -= this.speed; break;
            case DIRECTION_BOTTOM:this.y += this.speed; break;
        }
    }

    checkCollisions() {
        const left = parseInt(this.x / oneBlockSize);
        const right = parseInt((this.x + this.width - 1) / oneBlockSize);
        const top = parseInt(this.y / oneBlockSize);
        const bottom = parseInt((this.y + this.height - 1) / oneBlockSize);

        return (
            map[top][left] === 1 ||
            map[top][right] === 1 ||
            map[bottom][left] === 1 ||
            map[bottom][right] === 1
        );
    }

    changeDirectionIfPossible() {
        const tempDirection = this.direction;
        const newDir = this.calculateNewDirection(
            map,
            parseInt(this.target.x / oneBlockSize),
            parseInt(this.target.y / oneBlockSize)
        );
        this.direction = (typeof newDir !== 'undefined') ? newDir : tempDirection;

        this.moveForwards();
        if (this.checkCollisions()) {
            this.moveBackwards();
            this.direction = tempDirection;
        } else {
            this.moveBackwards();
        }
    }

    calculateNewDirection(map, destX, destY) {
        const mp = map.map(row => row.slice());
        const numRows = mp.length;
        const numCols = mp[0].length;
        const queue = [{
            x: this.getMapX(),
            y: this.getMapY(),
            moves: []
        }];

        while (queue.length > 0) {
            const poped = queue.shift();
            if (poped.x === destX && poped.y === destY) {
                return poped.moves[0];
            }

            mp[poped.y][poped.x] = 1;

            const neighbors = this.addNeighbors(poped, mp, numCols, numRows);
            for (let i = neighbors.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [neighbors[i], neighbors[j]] = [neighbors[j], neighbors[i]];
            }

            queue.push(...neighbors);
        }

        // אם אין מסלול, בחר כיוון חוקי אקראי
        const possibleDirs = [DIRECTION_UP, DIRECTION_BOTTOM, DIRECTION_LEFT, DIRECTION_RIGHT].filter(d => {
            this.direction = d;
            this.moveForwards();
            const coll = this.checkCollisions();
            this.moveBackwards();
            return !coll;
        });
        return possibleDirs.length > 0 ? possibleDirs[Math.floor(Math.random() * possibleDirs.length)] : this.direction;
    }

    addNeighbors(poped, mp, numCols, numRows) {
        const queue = [];
        const dirs = [
            { dx: -1, dy: 0, dir: DIRECTION_LEFT },
            { dx: 1, dy: 0, dir: DIRECTION_RIGHT },
            { dx: 0, dy: -1, dir: DIRECTION_UP },
            { dx: 0, dy: 1, dir: DIRECTION_BOTTOM },
        ];

        for (let d of dirs) {
            const nx = poped.x + d.dx;
            const ny = poped.y + d.dy;
            if (nx >= 0 && nx < numCols && ny >= 0 && ny < numRows && mp[ny][nx] !== 1) {
                const tempMoves = poped.moves.slice();
                tempMoves.push(d.dir);
                queue.push({ x: nx, y: ny, moves: tempMoves });
            }
        }
        return queue;
    }

    getMapX() { return Math.floor(this.x / oneBlockSize); }
    getMapY() { return Math.floor(this.y / oneBlockSize); }
    getMapXRightSide() { return Math.min(Math.floor((this.x + this.width - 1) / oneBlockSize), map[0].length - 1); }
    getMapYRightSide() { return Math.min(Math.floor((this.y + this.height - 1) / oneBlockSize), map.length - 1); }

    changeAnimation() {
        this.currentFrame = this.currentFrame === this.frameCount ? 1 : this.currentFrame + 1;
    }

    draw() {
        canvasContext.save();
        canvasContext.drawImage(
            ghostFrames,
            this.imageX,
            this.imageY,
            this.imageWidth,
            this.imageHeight,
            this.x + offsetX,
            this.y + offsetY,
            this.width,
            this.height
        );
        canvasContext.restore();
    }
}

let updateGhosts = () => ghosts.forEach(g => g.moveProcess());
let drawGhosts = () => ghosts.forEach(g => g.draw());
