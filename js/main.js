// We will use `strict mode`, which helps us by having the browser catch many common JS mistakes
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode
"use strict";
const app = new PIXI.Application(600,400);
let game= document.querySelector(".game");
game.appendChild(app.view);

// constants
const sceneWidth = app.view.width;
const sceneHeight = app.view.height;	

// pre-load the images
PIXI.loader.
add(["images/hotDog.png","images/pete.png", "images/burg.png","images/lure1.png","images/lure2.png","images/lure3.png","images/fish1.png","images/fish2.png","images/fish3.png","images/fish4.png","images/fish5.png","images/background.png","images/gameBG.png","images/cast.png","images/reel.png","images/whaleNeutral.png","images/whaleLine.png"]).
on("progress",e=>{}).
load(setup);

// aliases
let stage;

// game variables
let startScene;
let gameScene,scoreLabel,timerLabel;
let bait1Label, bait2Label, bait3Label;
let lure1Label, lure2Label, lure3Label;
let caughtFish;
let gameOverScene;
let biteSound, initialSplashSound, longSplashSound;
let baitButton,lureButton,bait1Button,bait2Button,bait3Button,lure1Button,lure2Button,lure3Button;
let biteLabel,reelLabel, tensionLabel;
let baitRates;
let lureRates;
let fish1,fish2,fish3,fish4,fish5;
let fishOnLine;
let gameOverScoreLabel, highscoreLabel;
let bait1Rate, bait2Rate, bait3Rate;
let lure1Rate, lure2Rate, lure3Rate;
let fishNum, fishTime;
let clicksToCatch,timeTillLost,lineTension;
let castTextures, reelTextures;
let cast, reel;
let timeTillBite;
let score;
let whaleNeutral, whaleLine;
let timer;
let usingBait, usingLure;
let paused = true;

function loadCastSheet(){
    let spriteSheet = PIXI.BaseTexture.fromImage("images/cast.png");
    let width = 200;
    let height = 250;
    let numFrames = 15;
    let textures = [];
    for(let i=0;i<numFrames;i++){
        let frame = new PIXI.Texture(spriteSheet, new PIXI.Rectangle(i*width, 0, width, height));
        textures.push(frame);
    }
    castTextures= textures;
}

function loadReelSheet(){
    let spriteSheet = PIXI.BaseTexture.fromImage("images/reel.png");
    let width = 200;
    let height = 250;
    let numFrames = 2;
    let textures = [];
    for(let i=0;i<numFrames;i++){
        let frame = new PIXI.Texture(spriteSheet, new PIXI.Rectangle(i*width, 0, width, height));
        textures.push(frame);
    }
    reelTextures= textures;
}


function setup() {
	stage = app.stage;
    app.background= 0x4E75B2;
	// #1 - Create the `start` scene
	startScene = new PIXI.Container();
    stage.addChild(startScene);
    
    let bg1= new PIXI.Sprite.from(PIXI.loader.resources["images/background.png"].texture);
    bg1.x = 0;
    bg1.y = 0;
    startScene.addChild(bg1);
    
	// #2 - Create the main `game` scene and make it invisible
    gameScene = new PIXI.Container();
    gameScene.visible = false;
    stage.addChild(gameScene);
    
    let bg2= new PIXI.Sprite.from(PIXI.loader.resources["images/gameBG.png"].texture);
    bg2.x = 0;
    bg2.y = 0;
    gameScene.addChild(bg2);
    
    loadCastSheet();
    loadReelSheet();
    
    
    whaleNeutral= new PIXI.Sprite.from(PIXI.loader.resources["images/whaleNeutral.png"].texture);
    whaleNeutral.x=200;
    whaleNeutral.y=sceneHeight-350;
    gameScene.addChild(whaleNeutral);
    
    whaleLine = new PIXI.Sprite.from(PIXI.loader.resources["images/whaleLine.png"].texture);
    whaleLine.x=200;
    whaleLine.y=sceneHeight-350;
    
    fish1= new PIXI.Sprite.from(PIXI.loader.resources["images/fish1.png"].texture);
    fish1.x=370;
    fish1.y=sceneHeight-200;
    
    fish2= new PIXI.Sprite.from(PIXI.loader.resources["images/fish2.png"].texture);
    fish2.x=370;
    fish2.y=sceneHeight-200;
    
    fish3= new PIXI.Sprite.from(PIXI.loader.resources["images/fish3.png"].texture);
    fish3.x=370;
    fish3.y=sceneHeight-200;
    
    fish4= new PIXI.Sprite.from(PIXI.loader.resources["images/fish4.png"].texture);
    fish4.x=370;
    fish4.y=sceneHeight-200;
    
    fish5= new PIXI.Sprite.from(PIXI.loader.resources["images/fish5.png"].texture);
    fish5.x=370;
    fish5.y=sceneHeight-200;
    
    
    
    reel = new PIXI.extras.AnimatedSprite(reelTextures);
    reel.x= whaleNeutral.x;
    reel.y= whaleNeutral.y;
    reel.animationSpeed=1/5;
    reel.loop = true;    
    
    
    cast = new PIXI.extras.AnimatedSprite(castTextures);
    cast.x= whaleNeutral.x;
    cast.y= whaleNeutral.y;
    cast.animationSpeed=1/3;
    cast.loop = false;
    cast.onComplete = e => {
        gameScene.removeChild(cast)
        gameScene.addChild(whaleLine);
        
    }
    
    
    
	// #3 - Create the `gameOver` scene and make it invisible
	gameOverScene = new PIXI.Container()
    gameOverScene.visible = false;
    stage.addChild(gameOverScene);
    let bg3= new PIXI.Sprite.from(PIXI.loader.resources["images/background.png"].texture);
    bg3.x = 0;
    bg3.y = 0;
    gameOverScene.addChild(bg3);

    
	// #4 - Create labels for all 3 scenes
    createLabelsAndButtons();
	document.addEventListener("click",clicked);
    document.addEventListener("keydown" , function(event){

        if(event.keyCode == 8 && gameScene.visible==true){
            paused = !paused;
        }
    });
   
	// #5 - creates the fishing rates
    const goodRate = [10,20,35,60,100];
    const medRate = [20,40,60,80,100];
    const badRate = [80,90,95,98,100];
    let rand1 = (Math.random()*2).toFixed(0);
    if(rand1==0){
        bait1Rate=goodRate;
        bait2Rate=medRate;
        bait3Rate=badRate;
    }
    else if(rand1==1){
        bait2Rate=goodRate;
        bait3Rate=medRate;
        bait1Rate=badRate;
    }
    else{
        bait3Rate=goodRate;
        bait1Rate=medRate;
        bait2Rate=badRate;
    }    
    let rand2 = (Math.random()*2).toFixed(0);
    if(rand2==0){
        lure1Rate=goodRate;
        lure2Rate=medRate;
        lure3Rate=badRate;

    }
    else if(rand2==1){
        lure2Rate=goodRate;
        lure3Rate=medRate;
        lure1Rate=badRate;
    }
    else{
        lure3Rate=goodRate;
        lure1Rate=medRate;
        lure2Rate=badRate;
    }
    
    
	// #6 - Load Sounds
    
    biteSound = new Howl({
        src: ['sounds/bite.wav']
    });
    
    initialSplashSound = new Howl({
        src: ['sounds/initialSplash.wav']
    });
    
    longSplashSound = new Howl({
        src: ['sounds/longSplash.wav']
    });
    
    
    // #8 - Start update loop
    app.ticker.add(gameLoop);
	

}


function createLabelsAndButtons(){
    //1 START SCENE SET UP
    //1A 
    let buttonStyle = new PIXI.TextStyle({
        fill: 0x00FF98,
        fontSize: 48,
        fontFamily: "Luckiest Guy",
        strokeThickness: 10
    });
    
    let startLabel1 = new PIXI.Text("Saco");
    startLabel1.style = new PIXI.TextStyle({
        fill: 0x00FF98,
        fontSize: 96,
        fontFamily: 'Luckiest Guy',
        //stroke: 0x9effff,
        strokeThickness: 10
    });
    startLabel1.x=190;
    startLabel1.y=120;
    startScene.addChild(startLabel1);
        
    
    //1c
    let startButton= new PIXI.Text("PLAY");
    startButton.style = buttonStyle;
    startButton.x = 235;
    startButton.y = sceneHeight-100;
    startButton.interactive = true;
    startButton.buttonMode = true;
    startButton.on("pointerup",startGame);      //function reference
    startButton.on('pointerover',e=>e.target.alpha = 0.7);  //cons
    startButton.on('pointerout',e=>e.currentTarget.alpha=1.0);
    startScene.addChild(startButton);

    //2 GAMEPLay
    let textStyle = new PIXI.TextStyle({
        fill:0x00FF98,
        fontSize: 18,
        fontFamily: "Futura",
        //stroke: 0xFF0000,
        strokeThickness: 4
    });
    //2A 
    scoreLabel = new PIXI.Text();
    scoreLabel.style = textStyle;
    scoreLabel.x=5;
    scoreLabel.y=5;
    gameScene.addChild(scoreLabel);
    increaseScoreBy(0);
    let highscore= localStorage.getItem("cxa7619highscore");
    if(highscore==null)
        highscoreLabel= new PIXI.Text(`Highscore 0`);
    else
        highscoreLabel= new PIXI.Text(`Highscore ${highscore}`);
    
    highscoreLabel.style
    highscoreLabel.style = textStyle;
    highscoreLabel.x=5;
    highscoreLabel.y=25;
    gameScene.addChild(highscoreLabel);
        

    
    
    //2B
    timerLabel = new PIXI.Text();
    timerLabel.style = textStyle;
    timerLabel.x=515;
    timerLabel.y=5;
    gameScene.addChild(timerLabel);
    increaseScoreBy(0);
    
    //2C
    baitButton= new PIXI.Text("Bait");
    baitButton.style = buttonStyle;
    baitButton.x = 175;
    baitButton.y = sceneHeight-100;
    baitButton.interactive = true;
    baitButton.buttonMode = true;
    baitButton.on('pointerup', makeBaitMenu)     //function reference
    baitButton.on('pointerover',e=>e.target.alpha = 0.7);  //cons
    baitButton.on('pointerout',e=>e.currentTarget.alpha=1.0);
    gameScene.addChild(baitButton);
    
    
    //2D
    lureButton= new PIXI.Text("Lure");
    lureButton.style = buttonStyle;
    lureButton.x = 325;
    lureButton.y = sceneHeight-100;
    lureButton.interactive = true;
    lureButton.buttonMode = true;
    lureButton.on("pointerup",makeLureMenu);      //function reference
    lureButton.on('pointerover',e=>e.target.alpha = 0.7);  //cons
    lureButton.on('pointerout',e=>e.currentTarget.alpha=1.0);
    gameScene.addChild(lureButton);
    
    let bStyle = new PIXI.TextStyle({
        fill: 0x00FF98,
        fontSize: 24,
        fontFamily: "Luckiest Guy",
        strokeThickness: 10
    });
    
    bait1Label= new PIXI.Text("Fish Hot Dog");
    bait1Label.style =  bStyle;
    bait1Label.x =50;
    bait1Label.y = sceneHeight-50;
    bait1Label.interactive = true;
    bait1Label.buttonMode = true;
    bait1Label.on("pointerup",function(){
        baitChose(1);
    });      //function reference
    bait1Label.on('pointerover',e=>e.target.alpha = 0.7);  //cons
    bait1Label.on('pointerout',e=>e.currentTarget.alpha=1.0);
    bait1Label.visible =false;
    gameScene.addChild(bait1Label);
    
    bait1Button= new PIXI.Sprite.from(PIXI.loader.resources["images/hotDog.png"].texture);
    bait1Button.x = 85;
    bait1Button.y = sceneHeight-125;
    bait1Button.interactive = true;
    bait1Button.buttonMode = true;
    bait1Button.on("pointerup",function(){
        baitChose(1);
    });      //function reference
    bait1Button.on('pointerover',e=>e.target.alpha = 0.7);  //cons
    bait1Button.on('pointerout',e=>e.currentTarget.alpha=1.0);
    bait1Button.visible =false;
    gameScene.addChild( bait1Button);
    
    bait2Label= new PIXI.Text("Fish Pizza");
    bait2Label.style =  bStyle;
    bait2Label.x = 250;
    bait2Label.y = sceneHeight-50;
    bait2Label.interactive = true;
    bait2Label.buttonMode = true;
    bait2Label.on("pointerup",function(){
        baitChose(2);
    });      //function reference
    bait2Label.on('pointerover',e=>e.target.alpha = 0.7);  //cons
    bait2Label.on('pointerout',e=>e.currentTarget.alpha=1.0);
    bait2Label.visible =false;    
    gameScene.addChild( bait2Label);
    
    bait2Button= new PIXI.Sprite.from(PIXI.loader.resources["images/pete.png"].texture);
    bait2Button.x = 275;
    bait2Button.y = sceneHeight-125;
    bait2Button.width = 64;
    bait2Button.height = 64;
    bait2Button.interactive = true;
    bait2Button.buttonMode = true;
    bait2Button.on("pointerup",function(){
        baitChose(2);
    });      //function reference
    bait2Button.on('pointerover',e=>e.target.alpha = 0.7);  //cons
    bait2Button.on('pointerout',e=>e.currentTarget.alpha=1.0);
    bait2Button.visible =false;
    gameScene.addChild( bait2Button);
    
    
    bait3Label= new PIXI.Text("Fish Burger");
    bait3Label.style =  bStyle;
    bait3Label.x = 425;
    bait3Label.y = sceneHeight-50;
    bait3Label.interactive = true;
    bait3Label.buttonMode = true;
    bait3Label.on("pointerup",function(){
        baitChose(3);
    });      //function reference
    bait3Label.on('pointerover',e=>e.target.alpha = 0.7);  //cons
    bait3Label.on('pointerout',e=>e.currentTarget.alpha=1.0);
    bait3Label.visible =false;
    gameScene.addChild( bait3Label);
    
    bait3Button= new PIXI.Sprite.from(PIXI.loader.resources["images/burg.png"].texture);
    bait3Button.x = 460;
    bait3Button.y = sceneHeight-125;
    bait3Button.width = 64;
    bait3Button.height = 64;
    bait3Button.interactive = true;
    bait3Button.buttonMode = true;
    bait3Button.on("pointerup",function(){
        baitChose(3);
    });      //function reference
    bait3Button.on('pointerover',e=>e.target.alpha = 0.7);  //cons
    bait3Button.on('pointerout',e=>e.currentTarget.alpha=1.0);
    bait3Button.visible =false;
    gameScene.addChild( bait3Button);
    
    lure1Label= new PIXI.Text("Lure 1");
    lure1Label.style =  bStyle;
    lure1Label.x = 80;
    lure1Label.y = sceneHeight-50;
    lure1Label.interactive = true;
    lure1Label.buttonMode = true;
    lure1Label.on("pointerup",function(){
        lureChose(1);
    });      //function reference
    lure1Label.on('pointerover',e=>e.target.alpha = 0.7);  //cons
    lure1Label.on('pointerout',e=>e.currentTarget.alpha=1.0);
    lure1Label.visible = false;
    gameScene.addChild(lure1Label);
    
    lure1Button= new PIXI.Sprite.from(PIXI.loader.resources["images/lure1.png"].texture);
    lure1Button.x = 85;
    lure1Button.y = sceneHeight-100;
    lure1Button.width = 64;
    lure1Button.height = 64;
    lure1Button.interactive = true;
    lure1Button.buttonMode = true;
    lure1Button.on("pointerup",function(){
        lureChose(1);
    });      //function reference
    lure1Button.on('pointerover',e=>e.target.alpha = 0.7);  //cons
    lure1Button.on('pointerout',e=>e.currentTarget.alpha=1.0);
    lure1Button.visible =false;
    gameScene.addChild(lure1Button);
    
    lure2Label= new PIXI.Text("Lure 2");
    lure2Label.style =  bStyle;
    lure2Label.x = 272;
    lure2Label.y = sceneHeight-50;
    lure2Label.interactive = true;
    lure2Label.buttonMode = true;
    lure2Label.on("pointerup",function(){
        lureChose(2);
    });      //function reference
    lure2Label.on('pointerover',e=>e.target.alpha = 0.7);  //cons
    lure2Label.on('pointerout',e=>e.currentTarget.alpha=1.0);
    lure2Label.visible =false;
    gameScene.addChild( lure2Label);
    
    
    
    lure2Button= new PIXI.Sprite.from(PIXI.loader.resources["images/lure2.png"].texture);
    lure2Button.x = 275;
    lure2Button.y = sceneHeight-100;
    lure2Button.width = 64;
    lure2Button.height = 64;
    lure2Button.interactive = true;
    lure2Button.buttonMode = true;
    lure2Button.on("pointerup",function(){
        lureChose(2);
    });      //function reference
    lure2Button.on('pointerover',e=>e.target.alpha = 0.7);  //cons
    lure2Button.on('pointerout',e=>e.currentTarget.alpha=1.0);
    lure2Button.visible =false;
    gameScene.addChild( lure2Button);
    
    
    lure3Label= new PIXI.Text("Lure 3");
    lure3Label.style =  bStyle;
    lure3Label.x = 450;
    lure3Label.y = sceneHeight-50;
    lure3Label.interactive = true;
    lure3Label.buttonMode = true;
    lure3Label.on("pointerup",function(){
        lureChose(3);
    });      //function reference
    lure3Label.on('pointerover',e=>e.target.alpha = 0.7);  //cons
    lure3Label.on('pointerout',e=>e.currentTarget.alpha=1.0);
    lure3Label.visible =false;
    gameScene.addChild(lure3Label);
    
    lure3Button= new PIXI.Sprite.from(PIXI.loader.resources["images/lure3.png"].texture);
    lure3Button.x = 455;
    lure3Button.y = sceneHeight-100;
    lure3Button.width = 64;
    lure3Button.height = 64;
    lure3Button.interactive = true;
    lure3Button.buttonMode = true;
    lure3Button.on("pointerup",function(){
        lureChose(3);
    });      //function reference
    lure3Button.on('pointerover',e=>e.target.alpha = 0.7);  //cons
    lure3Button.on('pointerout',e=>e.currentTarget.alpha=1.0);
    lure3Button.visible =false;
    gameScene.addChild(lure3Button);

    biteLabel= new PIXI.Text("BITE!");    
    biteLabel.style = buttonStyle;
    biteLabel.x = 240;
    biteLabel.y = sceneHeight-390;
    biteLabel.visible = false
    gameScene.addChild(biteLabel);
    
    reelLabel= new PIXI.Text("You're going to lose the fish!! Reel in!");    
    reelLabel.style = bStyle;
    reelLabel.x = 150;
    reelLabel.y = sceneHeight-325;
    reelLabel.visible = false
    gameScene.addChild(reelLabel);
    
    tensionLabel= new PIXI.Text("Line's too tight!! Stop reeling!");    
    tensionLabel.style = bStyle;
    tensionLabel.x = 150;
    tensionLabel.y = sceneHeight-325;
    tensionLabel.visible = false
    gameScene.addChild(tensionLabel);
    
    
    
    //3 set up game over scene
    //3A make game over text
    let gameOverText = new PIXI.Text("Game Over!"); 
    gameOverText.style = buttonStyle;
    gameOverText.x =150;
    gameOverText.y = sceneHeight/2 - 160;
    gameOverScene.addChild(gameOverText);
    
    //make final score
    gameOverScoreLabel = new PIXI.Text("Your final score: ");
    
    gameOverScoreLabel.style = bStyle;
    gameOverScoreLabel.x=150;
    gameOverScoreLabel.y = sceneHeight/2 +20;
    gameOverScene.addChild(gameOverScoreLabel);
    
    //3B - make "play again?" button
    let playAgainButton = new PIXI.Text("Play Again?");
    playAgainButton.style = buttonStyle;
    playAgainButton.x = 150;
    playAgainButton.y = sceneHeight-100;
    playAgainButton.interactive = true;
    playAgainButton.buttonMode = true;
    playAgainButton.on("pointerup",startGame);
    playAgainButton.on('pointerover',e=>e.target.alpha =0.7);
    playAgainButton.on('pointerout',e=>e.currentTarget.alpha =1.0);
    gameOverScene.addChild(playAgainButton);
}

/*
function pause(boy){
    let button= boy.keyCode;
    if(button==8&&gameScene.visible==true){
        paused = !paused;
    }
}*/
function increaseScoreBy(value){
    score += value;
    scoreLabel.text = `Score ${score}`;
}


function baitChose(baitNumber){
    usingBait=true;
    
    initialSplashSound.play();
    
    gameScene.removeChild(whaleNeutral);
    gameScene.addChild(cast);
    cast.gotoAndPlay(0);
    
    bait1Label.visible = false;    
    bait2Label.visible = false;
    bait3Label.visible = false; 
    
    bait1Button.visible = false;
    bait2Button.visible = false;
    bait3Button.visible = false;
    let randoy= Math.random()*100+1;
    switch (baitNumber){
        case 1:
            for(let i=0; i<bait1Rate.length;i++){
                if(randoy<=bait1Rate[i]){
                    fishNum=i;
                    break;
                }
            }                
            break
        case 2:
            for(let i=0; i<bait2Rate.length;i++){
                if(randoy<=bait2Rate[i]){
                    fishNum=i;
                    break;
                }
            }
            break;
        case 3:
            for(let i=0; i<bait3Rate.length;i++){
                if(randoy<=bait3Rate[i]){
                    fishNum=i;
                    break;
                }
            }
            break;
    }
    timeTillBite=Math.random()*3+4;
}

function lureChose(lureNumber){
    usingLure=true;
    
    initialSplashSound.play();
    
    gameScene.removeChild(whaleNeutral);
    gameScene.addChild(cast);
    cast.gotoAndPlay(0);
    
    lure1Label.visible = false;    
    lure2Label.visible = false;
    lure3Label.visible = false; 
    
    lure1Button.visible = false;
    lure2Button.visible = false;
    lure3Button.visible = false;
    
    let randoo= Math.random()*100+1;

    switch (lureNumber){
        case 1:
            for(let i=0; i<lure1Rate.length;i++){
                if(randoo<=lure1Rate[i]){
                    fishNum=i;
                    break;
                }
            }                
            break
        case 2:
            for(let i=0; i<lure2Rate.length;i++){
                if(randoo<=lure2Rate[i]){
                    fishNum=i;
                    break;
                }
            }
            break;
        case 3:
            for(let i=0; i<lure3Rate.length;i++){
                if(randoo<=lure3Rate[i]){
                    fishNum=i;
                    break;
                }
            }
            break;
    }
    timeTillBite=Math.random()+2;

}


function hideBaitAndLure(){
    if(baitButton)
        baitButton.visible = false;
    if(lureButton)
        lureButton.visible = false;
}

function showBaitAndLure(){
    if(baitButton)
        baitButton.visible = true;
    if(lureButton)
        lureButton.visible = true;
}

function makeBaitMenu(){
    
    hideBaitAndLure();    
    
    bait1Label.visible =true;
    bait2Label.visible =true;
    bait3Label.visible =true;
    bait1Button.visible =true;
    bait2Button.visible =true;
    bait3Button.visible =true;
    
    
}

function makeLureMenu(){
    
    hideBaitAndLure();    
    lure1Label.visible =true;
    lure2Label.visible =true;
    lure3Label.visible =true;
    lure1Button.visible =true;
    lure2Button.visible =true;
    lure3Button.visible =true;        
}



function decreaseTimerBy(value){
    timer -= value;
    timerLabel.text = `Time: ${Math.round(timer)}`;
}


function startGame(){
    startScene.visible = false;
    gameOverScene.visible = false;
    gameScene.visible = true;
    score = 0;
    timer = 120;    
    increaseScoreBy(0);
    decreaseTimerBy(0);
    loadLevel();
}

function loadLevel(){
    
    paused = false;
}


function loadSpriteSheet(){
    /*let spriteSheet = PIXI.BaseTexture.fromImage("images/explosions.png");
    let width = 64;
    let height = 64;
    let numFrames = 16;
    let textures = [];
    for(let i=0;i<numFrames;i++){
        let frame = new PIXI.Texture(spriteSheet, new PIXI.Rectangle(i*width, 64, width, height));
        textures.push(frame);
    }
    return textures;*/
}

function clicked(){
    if(clicksToCatch!=null){
        clicksToCatch--;
    }
    if(lineTension!=null){
        lineTension+=2;
    }
}

function fishCaught(){
    fishTime=3;
    switch(fishNum){
        case 0:
            caughtFish=fish1;
            break;
        case 1:
            caughtFish=fish2;
            clicksToCatch=10;
            break;
        case 2:
            caughtFish=fish3;
            clicksToCatch=10;
            break;
        case 3:
            caughtFish=fish4;
            clicksToCatch=12;
            break;
        case 4:
            caughtFish=fish5;
            clicksToCatch=16;
            break;              
    }
    gameScene.addChild(caughtFish);
    gameScene.removeChild(reel);
    gameScene.addChild(whaleNeutral);    
    increaseScoreBy((fishNum+1)*20);
    fishOnLine=false;
    fishNum=null;
    timeTillLost=null;
    clicksToCatch=null;
    lineTension=null;
    usingBait = false;
    usingLure = false;

    reelLabel.visible=false;
    tensionLabel.visible=false;
    showBaitAndLure();
    
}

function fishLost(){
    gameScene.removeChild(reel);
    gameScene.addChild(whaleNeutral); 
    increaseScoreBy(-10);
    fishOnLine=false;
    fishNum=null;
    timeTillLost=null;
    clicksToCatch=null;
    lineTension=null;
    usingBait = false;
    usingLure = false;
    reelLabel.visible=false;
    tensionLabel.visible=false;
    showBaitAndLure();
}

function Bite(){
    longSplashSound.play();
    biteSound.play();
    gameScene.removeChild(whaleLine);
    gameScene.addChild(reel);
    reel.play();
    fishOnLine=true;
    if(usingBait){
        timeTillLost= Math.random()+4;
        switch(fishNum){
        case 0:
            clicksToCatch=6;
            break;
        case 1:
            clicksToCatch=10;
            break;
        case 2:
            clicksToCatch=10;
            break;
        case 3:
            clicksToCatch=12;
            break;
        case 4:
            clicksToCatch=16;
            break;              
        }
    }
    
    if(usingLure){
        lineTension=7.5;
        switch(fishNum){
        case 0:
            clicksToCatch=15;
            break;
        case 1:
            clicksToCatch=17;
            break;
        case 2:
            clicksToCatch=20;
            break;
        case 3:
            clicksToCatch=22;
            break;
        case 4:
            clicksToCatch=25;
            break;              
        }
    }
    
            
}


function end() {
    paused = true;
    let currenthighscore= localStorage.getItem("cxa7619highscore");
    if(score>currenthighscore)
        localStorage.setItem('cxa7619highscore',score);
    
    let gameOverScore = new PIXI.Text(score);
    let cStyle = new PIXI.TextStyle({
        fill: 0x00FF98,
        fontSize: 24,
        fontFamily: "Luckiest Guy",
        strokeThickness: 10

    });
    gameOverScore.style= cStyle;
    gameOverScore.x = gameOverScoreLabel.x+gameOverScoreLabel.width;
    gameOverScore.y = sceneHeight/2 +20;
    gameOverScene.addChild(gameOverScore);
    //gameOverScoreLabel.value =score;
    
    gameOverScene.visible = true;
    gameScene.visible = false;
}


function gameLoop(){
	if (paused) return; 
	
   
	// #1 - Calculate "delta time"
    let dt = 1/app.ticker.FPS;
    if (dt > 1/12) dt =1/12;
    decreaseTimerBy(dt)
    
    if(fishTime>0){
        fishTime-=dt;
        caughtFish.y-=0.3;
    }
    else{
        if(caughtFish!=undefined){
            caughtFish.y= sceneHeight-200;
            gameScene.removeChild(caughtFish);
        }
        
    }
    if(timeTillBite!=null)
    {
        timeTillBite-=dt;
        if(timeTillBite<=0)
        {
            Bite();
            timeTillBite=null;
        }
    }
        
    
    if(fishOnLine)
    {
        biteLabel.visible=true;
        if(usingBait)
        {
            if(timeTillLost!=null)
            {
                timeTillLost-=dt;
                if(timeTillLost<=0)
                {
                    fishOnLine=false;
                    timeTillLost=null;
                    fishLost();
                }
                else if(clicksToCatch<=0)                    
                    fishCaught();
    
            
            }
        }
        else if(usingLure)
        {
            if(lineTension!=null)
            {
                lineTension-=dt*3;
                
                if(lineTension<=0)
                    fishLost();
                else if(lineTension>=15)
                    fishLost();
                else if(clicksToCatch<=0)
                    fishCaught();
                
                if(lineTension<3.5)
                    reelLabel.visible= true;
                else
                    reelLabel.visible= false;                    
                if(lineTension>11)
                    tensionLabel.visible= true;
                else
                    tensionLabel.visible=false;
            }
        }                
    }
    else
    {
        reelLabel.visible=false;
        tensionLabel.visible=false;
        biteLabel.visible=false;
        longSplashSound.stop();
    }
    
	// #7 - Is game over?
	if(timer<=0){
        end();
        return;
    }
}