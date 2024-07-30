//board
let board;
let boardWidth = 956;
let boardHeight = 716;
let context;

//player
let playerWidth = 110;
let playerHeight = 110;
let playerX = boardWidth/2 - playerWidth/2;
let playerY = boardHeight*7/8 - playerHeight;
let playerRightImg;
let playerLeftImg;

let player = {
    img : null,
    x : playerX,
    y : playerY,
    width : playerWidth,
    height : playerHeight
}

//physics
let velocityX = 0; 
let velocityY = 0; //player jump speed
let initialVelocityY = -8; //starting velocity Y
let gravity = 0.4;
let superJumpFactor = 1.1; // 10% boost
let isSuperJumping = false; // To track if super jump is active
let superJumpDuration = 90; // boost duration in ms
let superJumpEndTime = 0; // time when the super jump ends

//platforms
let platformArray = [];
let platformWidth = 160;
let platformHeight = 70;
let platformImg;

let score = 0;
let maxScore = 0;
let gameOver = false;
let isPlayerMoving = false; // Track if the player is moving

window.onload = function() {
    board = document.getElementById("board");
    board.height = boardHeight;
    board.width = boardWidth;
    context = board.getContext("2d"); //used for drawing on the board

    //load images
    playerRightImg = new Image();
    playerRightImg.src = "./assets/miniboyright.png";
    player.img = playerRightImg;
    playerRightImg.onload = function() {
        context.drawImage(player.img, player.x, player.y, player.width, player.height);
    }

    playerLeftImg = new Image();
    playerLeftImg.src = "./assets/miniboyleft.png";

    platformImg = new Image();
    platformImg.src = "./assets/platform.png";

    velocityY = initialVelocityY;
    placePlatforms();
    requestAnimationFrame(update);
    document.addEventListener("keydown", movePlayer);
}

function update() {
    requestAnimationFrame(update);
    if (gameOver) {
        return;
    }
    context.clearRect(0, 0, board.width, board.height);

    //player
    player.x += velocityX;
    if (player.x > boardWidth) {
        player.x = 0;
    }
    else if (player.x + player.width < 0) {
        player.x = boardWidth;
    }

    // Apply gravity
    velocityY += gravity;
    player.y += velocityY;

    // Check if the player falls out of bounds
    if (player.y > boardHeight) {
        gameOver = true;
    }

    // Check if super jump duration has ended
    if (isSuperJumping && Date.now() > superJumpEndTime) {
        isSuperJumping = false;
    }

    // Apply super jump boost if active
    if (isSuperJumping) {
        velocityY = initialVelocityY * superJumpFactor;
    } else if (velocityY > initialVelocityY) {
        // Ensure the player doesn't exceed the maximum fall speed
        velocityY = Math.max(velocityY, initialVelocityY);
    }

    context.drawImage(player.img, player.x, player.y, player.width, player.height);

    //platforms
    for (let i = 0; i < platformArray.length; i++) {
        let platform = platformArray[i];
        if (velocityY < 0 && player.y < boardHeight*3/4) {
            platform.y -= initialVelocityY; //slide platform down
        }
        if (detectCollision(player, platform) && velocityY >= 0) {
            velocityY = initialVelocityY; //jump
            isPlayerMoving = true; // The player is interacting with a platform
        }
        context.drawImage(platform.img, platform.x, platform.y, platform.width, platform.height);
    }

    // clear platforms and add new platform
    while (platformArray.length > 0 && platformArray[0].y >= boardHeight) {
        platformArray.shift(); //removes first element from the array
        newPlatform(); //replace with new platform on top
    }

    // Update score only if the player is moving or interacting
    if (isPlayerMoving) {
        updateScore();
    }

    context.fillStyle = "white";
    context.font = "16px sans-serif";
    context.fillText(score, 5, 20);

    if (gameOver) {
        context.fillText("Game Over: Press 'Space' to Restart", boardWidth/7, boardHeight*7/8);
    }

    // Reset movement flag
    isPlayerMoving = false;
}

function movePlayer(e) {
    if (e.code == "ArrowRight" || e.code == "KeyD") { //move right
        velocityX = 4;
        player.img = playerRightImg;
        isPlayerMoving = true;
    }
    else if (e.code == "ArrowLeft" || e.code == "KeyA") { //move left
        velocityX = -4;
        player.img = playerLeftImg;
        isPlayerMoving = true;
    }
    else if (e.code == "Space") {
        if (gameOver) {
            //reset
            player = {
                img : playerRightImg,
                x : playerX,
                y : playerY,
                width : playerWidth,
                height : playerHeight
            }

            velocityX = 0;
            velocityY = initialVelocityY;
            score = 0;
            maxScore = 0;
            gameOver = false;
            placePlatforms();
        } else {
            // apply super jump boost
            isSuperJumping = true;
            superJumpEndTime = Date.now() + superJumpDuration;
        }
    }
}

function placePlatforms() {
    platformArray = [];

    //starting platforms
    let platform = {
        img : platformImg,
        x : boardWidth/2,
        y : boardHeight - 50,
        width : platformWidth,
        height : platformHeight
    }

    platformArray.push(platform);

    for (let i = 0; i < 6; i++) {
        let randomX = Math.floor(Math.random() * boardWidth*3/4); //(0-1) * boardWidth*3/4
        let platform = {
            img : platformImg,
            x : randomX,
            y : boardHeight - 75*i - 150,
            width : platformWidth,
            height : platformHeight
        }
    
        platformArray.push(platform);
    }
}

function newPlatform() {
    let randomX = Math.floor(Math.random() * boardWidth*3/4); //(0-1) * boardWidth*3/4
    let platform = {
        img : platformImg,
        x : randomX,
        y : -platformHeight,
        width : platformWidth,
        height : platformHeight
    }

    platformArray.push(platform);
}

function detectCollision(a, b) {
    return a.x < b.x + b.width &&   //a's top left corner doesn't reach b's top right corner
           a.x + a.width > b.x &&   //a's top right corner passes b's top left corner
           a.y < b.y + b.height &&  //a's top left corner doesn't reach b's bottom left corner
           a.y + a.height > b.y;    //a's bottom left corner passes b's top left corner
}

function updateScore() {
    let points = Math.floor(50*Math.random()); //(0-1) *50 --> (0-50)
    if (velocityY < 0) { //negative going up
        maxScore += points;
        if (score < maxScore) {
            score = maxScore;
        }
    }
}