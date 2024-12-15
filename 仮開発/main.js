"use strict";

//	Hello world(あさい)
//	test 2nd
/*
declare variables and constants
*/

const FONT = "12px DotGothic16";	//	フォント
const HEIGHT = 224;					//	仮想画面の高さ（ピクセル）
const WIDTH = 256;					//	仮装画面の幅（ピクセル） 
const SCROLL = 2;
const SMOOTH = 0;					//	小さい画像もボカさないでね！
const TILECOLUMN = 4;				//	マップチップの行数
const TILESIZE = 16;				//	タイルのピクセル数
const PLAYERWIDTH = 16;
const PLAYERHEIGHT = 32;
const WINDOWSTYLE = "rgba(60, 60, 0, 0.8)";
const FONTSTYLE = "#FFFFFF";

const gKey = new Uint8Array( 0x30 );	//	キー入力バッファ

let stageNumber = 0;
let MAP_HEIGHT = 9;					//	マップの高さ（タイル）
let MAP_WIDTH = 7;					//	マップの幅（タイル）
let START_X = 3;					//	開始位置X
let START_Y = 7;					//	開始位置Y
let BOX_X = 3;						//	BOX開始位置X
let BOX_Y = 5;						//	BOX開始位置Y

let isGameOver = false;

let gAngle = 0;
let gFrame = 0;						//	内部カウンタ
let gHeight;						//	実画面の高さ
let gWidth;							//	実画面の幅
let gImgMap;						//	マップチップを入れる
let gImgSprite;						//	プレイヤー
let gImgBackground;
let	gPlayerX = START_X * TILESIZE;	//	プレイヤー座標X
let	gPlayerY = START_Y * TILESIZE;	//	プレイヤー座標Y
let	gBoxX = BOX_X * TILESIZE;		//	プレイヤー座標X
let	gBoxY = BOX_Y * TILESIZE;		//	プレイヤー座標Y
let gScreen;						//	仮想画面 
let gMap;							//	マップのタイル構成
let gSprite;
let	gPlayerMoveX = 0;				//	移動量X
let	gPlayerMoveY = 0;				//	移動量Y
let	gBoxMoveX = 0;					//	移動量X
let	gBoxMoveY = 0;					//	移動量Y
let mapColumn;
let mapRow;

let initialPlayerAngle;



let soundBGM;
let soundCollision;
let soundDraggingBox;
let soundStageClear;
let soundGameOver;
let soundLaser;

let keyState = { 'ArrowLeft': false, 'ArrowUp': false, 'ArrowRight': false, 'ArrowDown': false };
let moveZeroTimer = null;		//	衝突z
let collisionSoundTimer = null;
let directionPikupikun;
let stepCounter = 0;

let indexFlag;
let indexPikupikun;

let keyboardDisabled = false;

let clear = 0;

const gFileMap = "img/BG.png";			//	specify map-chip image
const gFileSprite = "img/spriten.png";	//	specify player image
const gFileBackground = "img/background.jpg"	// specify background image

let fileSoundBGM = "sound/BGM/FC/FC_pikupikuTheme.mp3";
const fileSoundCollision = "sound/SE/collision.mp3";
const fileSoundDraggingBox = "sound/SE/draggingBox.mp3";
const fileSoundStageClear = "sound/SE/stageClear.mp3";
const fileSoundGameOver = "sound/SE/gameOver.mp3";
const fileSoundLaser = "sound/SE/laser.mp3";

/*
define functions
*/

//	Assign tile configuration to gMap from mapData.json
function LoadData() {
    return new Promise((resolve, reject) => {
        fetch('mapData.json') // specify json file
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                const MAP_KEY = `mapData_${stageNumber < 10 ? '0' + stageNumber : stageNumber}`;
                const SPRITE_KEY = `spriteData_${stageNumber < 10 ? '0' + stageNumber : stageNumber}`;
                const DIRECTION_KEY = `directionPikupikun_${stageNumber < 10 ? '0' + stageNumber : stageNumber}`;
                gMap = data[MAP_KEY];
                gSprite = data[SPRITE_KEY];
                directionPikupikun = data[DIRECTION_KEY];
                START_X = data.playerStartX[stageNumber];
                START_Y = data.playerStartY[stageNumber];
				BOX_X = data.boxStartX[stageNumber];
                BOX_Y = data.boxStartY[stageNumber];
                indexFlag = gSprite.indexOf("F");
				indexPikupikun = findAllIndexes(gSprite, "P");
                MAP_WIDTH = data.mapColumn[stageNumber] + 1;
                MAP_HEIGHT = data.mapRow[stageNumber] + 1;
				initialPlayerAngle = data.playerAngle[stageNumber];
				console.log(indexPikupikun)
                resolve(); // 完了を通知
            })
            .catch(error => {
                console.error("Error loading data:", error);
                reject(error); // エラーを通知
            });
    });
}

/*
レンダリング関数
*/

//	MAP・箱・プレイヤー・探索マス表示の順に描画
function DrawMain() {
	const g = gScreen.getContext("2d");	//	get 2D context of virtual display

	g.drawImage(gImgBackground, 0, 0);	//	render the background image

	DrawSprite.pikupikuOrder = 0;	//	

	//	render stege maps
	for (let dy = 0; dy < MAP_HEIGHT; dy++) {
		for (let dx = 0; dx < MAP_WIDTH; dx++) {
			DrawTile(
				g, 
		 		WIDTH/2 + (dx - 1/2) * TILESIZE - gPlayerX,
				HEIGHT/2 + (dy - 1/2) * TILESIZE - gPlayerY, 
				gMap[dx + dy * MAP_WIDTH]);
			DrawSprite(
				g, 
		 		WIDTH/2 + (dx - 1/2) * TILESIZE - gPlayerX,
				HEIGHT/2 + (dy - 1/2) * TILESIZE - gPlayerY, 
				gSprite[dx + dy * MAP_WIDTH]);
		}
	}

	//	render the box
	g.drawImage(gImgSprite, 
		48, 
		32, 
		PLAYERWIDTH, 16,
		(WIDTH - TILESIZE) / 2 + gBoxX - gPlayerX, (HEIGHT - TILESIZE) / 2 + gBoxY - gPlayerY, 
		PLAYERWIDTH, 16);	//	プレイヤー画像の表示

	if (indexPikupikun && Array.isArray(indexPikupikun)) {
    for (let n = 0; n < indexPikupikun.length; n++) {
        ExploreSquare(directionPikupikun[n], 
			(indexPikupikun[n] % MAP_WIDTH) * TILESIZE, 
			Math.floor(indexPikupikun[n] / MAP_WIDTH) * TILESIZE);
    	}
		} else {
   		console.error("indexPikupikun is not defined or not an array.");
		}

	//　render the player
	g.drawImage(gImgSprite, 
		gAngle * PLAYERWIDTH, 
		( gFrame >> 4 & 1 ) * PLAYERHEIGHT + 304, 
		PLAYERWIDTH, PLAYERHEIGHT,
		(WIDTH - PLAYERWIDTH * 2 + TILESIZE)/2, (HEIGHT - PLAYERHEIGHT * 2 + TILESIZE)/2, 
		PLAYERWIDTH, PLAYERHEIGHT);	//	プレイヤー画像の表示



	//DrawLaser();
	
/*
*	debug elements
*/

	//	red lines illustrate player coordinate
	//g.fillStyle = "#ff0000";
	//g.fillRect(0, HEIGHT/2 - 1, WIDTH, 2);
	//g.fillRect(WIDTH/2 - 1, 0, 2, HEIGHT);

	//	set window color
	g.fillStyle = WINDOWSTYLE;
	g.fillRect(4, 189, 248, 20);

	//	display frame reload
	g.font = FONT;
g.fillStyle = FONTSTYLE;

const paddedX = String(Math.floor(gPlayerX)).padStart(3, '0'); // gPlayerXを3桁ゼロパディング
const paddedY = String(Math.floor(gPlayerY)).padStart(3, '0'); // gPlayerYを3桁ゼロパディング
const paddedStep = String(stepCounter).padStart(4, '0'); // stepCounterを3桁ゼロパディング
const paddedStage = String(stageNumber).padStart(2, '0'); // stageNumberを3桁ゼロパディング
const mapValue = gMap[Math.floor(gPlayerY / TILESIZE) * MAP_WIDTH + Math.floor(gPlayerX / TILESIZE)];

g.fillText(`x,y=${paddedX}, ${paddedY} step=${paddedStep} s=${paddedStage} m=${mapValue} ${isGameOver}`, 10, 203);


}

//	マップチップ生成
function DrawTile(g, x, y, idx) {
	const ix = (idx % TILECOLUMN) * TILESIZE; 	//　タイルのindexからx座標を取得
	const iy = Math.floor(idx / TILECOLUMN) * TILESIZE;		//　タイルのindexからy座標を取得
	g.drawImage(gImgMap, ix, iy, TILESIZE, TILESIZE, x, y, TILESIZE, TILESIZE);	//	タイルを描画
}

//	スプライト生成
function DrawSprite(g, x, y, idx) {
    if (typeof DrawSprite.pikupikuOrder === 'undefined') {
        DrawSprite.pikupikuOrder = 0; // 初期化
    }

	if (idx === "F") {
		//	flag
		g.drawImage(gImgSprite, 
			( gFrame >> 4 & 1 ) * TILESIZE, 32, 
			TILESIZE, TILESIZE, x, y, TILESIZE, TILESIZE);	//	プレイヤー画像の表示
	
		//	flag shadow
		g.drawImage(gImgSprite, 
			32, 32, 
			TILESIZE, TILESIZE, x, y, TILESIZE, TILESIZE);	//	プレイヤー画像の表示
	
		g.fillStyle = "rgba(0, 256, 256, 0.5)";
		g.fillRect(x,y,TILESIZE,TILESIZE)
    } else if (idx === "P") {
        // pikupikun の描画
        g.fillStyle = "rgba(256, 0, 0, 0.5)";
        g.drawImage(gImgSprite, 16, 16, TILESIZE, TILESIZE, x, y, TILESIZE, TILESIZE);

        const direction = directionPikupikun[DrawSprite.pikupikuOrder % directionPikupikun.length];
        if (direction === 0) {
            g.drawImage(gImgSprite,  
                32 - (BinaryOscillator(80, 8) * 32), 
                0 + (BinaryOscillator(80, 8) * 16), 
                TILESIZE, TILESIZE, x, y, TILESIZE, TILESIZE);
        } else if (direction === 1) {
            g.drawImage(gImgSprite,  
                0, 
                0 + (BinaryOscillator(80, 8) * 16), 
                TILESIZE, TILESIZE, x, y, TILESIZE, TILESIZE);
        } else if (direction === 2) {
            g.drawImage(gImgSprite,  
                16 - (BinaryOscillator(80, 8) * 16), 
                0 + (BinaryOscillator(80, 8) * 16), 
                TILESIZE, TILESIZE, x, y, TILESIZE, TILESIZE);
        } else {
            g.drawImage(gImgSprite,  
                48 - (BinaryOscillator(80, 8) * 48), 
                0 + (BinaryOscillator(80, 8) * 16), 
                TILESIZE, TILESIZE, x, y, TILESIZE, TILESIZE);
        }
        DrawSprite.pikupikuOrder++; // 次のピクピクンに進む
    }
}
//	レーザー表示
function DrawLaser() {
    
}


//	canvasに映像出力
function WmPaint()	{
	DrawMain();

	const ca = document.getElementById("gameDisplay");	//	main L
	const g = ca.getContext("2d");		//	2D ` 
	g.drawImage(gScreen, 0, 0, gScreen.width, gScreen.height, 0, 0, gWidth, gHeight);	//	   
}

//	ブラウザサイズ変更イベント
function WmSize()	{
	const ca = document.getElementById("gameDisplay");	//	gameDisplayのcanvasを取得
	ca.width = window.innerWidth;					//	 canvasの横幅をウィンドウ幅に変更
	ca.height = window.innerHeight - 100;					//	 canvasの縦幅をウィンドウ幅に変更

	const g = ca.getContext("2d");				//	2D描画コンテキスト取得
	g.imageSmoothingEnabled = g.msImageSmoothingEnabled = false;	//	  ドット絵に対するアンチエイリアスを消す

	//	ウィンドウ＝canvasからゲーム画面がはみ出ないように、幅の小さいほうに合わせる
	gWidth = ca.width;
	gHeight = ca.height;
	if (gWidth / WIDTH < gHeight / HEIGHT) {
		gHeight = gWidth * HEIGHT / WIDTH;
	} else {
		gWidth = gHeight * WIDTH / HEIGHT;
	}
}

//	タイマーイベント発生時の処理   
function WmTimer()	{
	gFrame++;			//	 内部カウンタの加算
	TickField();
	WmPaint();
}

/*
サウンド関数（関数名見てね）
*/

function PlaySoundCollision() {
	soundCollision.currentTime = 0; // 再生位置を先頭にリセット
	soundCollision.play(); // 効果音を再生
	}

function PlaySoundDraggingBox() {
	soundDraggingBox.currentTime = 0; // 再生位置を先頭にリセット
	soundDraggingBox.playbackRate = 2.5;
	soundDraggingBox.play(); // 効果音を再生
	}

function PlayStageClear() {
	soundStageClear.currentTime = 0; // 再生位置を先頭にリセット
	soundStageClear.volume = 0.3;
    soundStageClear.play(); // 再生開始
    return soundStageClear; // Audioオブジェクトを返す
	}

function PlayLaser() {
	soundLaser.currentTime = 0; // 再生位置を先頭にリセット
	soundLaser.volume = 0.3;
    soundLaser.play(); // 再生開始
    return soundLaser; // Audioオブジェクトを返す
	}

function PlayGameOver() {
	soundGameOver.currentTime = 0; // 再生位置を先頭にリセット
	soundGameOver.volume = 0.3;
    soundGameOver.play(); // 再生開始
    return soundGameOver; // Audioオブジェクトを返す
	}

//	決まった周期で0か1返してくれる関数
function BinaryOscillator(totalPeriod, activeDuration) {
	const counter = gFrame % totalPeriod; // 40フレームの周期で計算（32フレームの0 + 8フレームの1）
		if (counter < totalPeriod - activeDuration) {
			return 0; // 最初の32フレーム間は0を返す
		} else {
			return 1; // 次の8フレーム間は1を返す
		}
	}

//	indexOfの全部探してくれるVer.
function findAllIndexes(array, target) {
    return array.reduce((indexes, element, index) => {
        if (element === target) {
            indexes.push(index);
        }
        return indexes;
    }, []);
}

//	進入禁止
function ProhibitEntry() {
	gPlayerMoveX = 0;									//	移動禁止X
	gPlayerMoveY = 0;									//	移動禁止Y
	}

/*
イベント関数
*/

function InitializeEvent() {
	gPlayerX = START_X * TILESIZE;	//	プレイヤー座標X
	gPlayerY = START_Y * TILESIZE;	//	プレイヤー座標Y
	gBoxX = BOX_X * TILESIZE;	//	プレイヤー座標X
	gBoxY = BOX_Y * TILESIZE;	//	プレイヤー座標Y
	gAngle = initialPlayerAngle;
	clear = 0;
}

//	ぴくぴくんの視界探索（見つかったら死ぬぞ）
function ExploreSquare(directionPikupikun, pikupikunX, pikupikunY) {
	const g = gScreen.getContext("2d");
	g.fillstyle = "rgba(60, 60, 0, 0.8)";
	let exploreX = pikupikunX;
	let exploreY = pikupikunY;
	if (directionPikupikun == 0) {
		exploreX -= TILESIZE
		for (; exploreX > 0; exploreX -= TILESIZE) {
			if (!isGameOver) {g.fillRect(WIDTH/2 - gPlayerX - TILESIZE/2 + exploreX, HEIGHT/2 - gPlayerY + exploreY - TILESIZE/2, TILESIZE, TILESIZE)
				}

			// boxに到達した場合は終了する
			if (gBoxX >= exploreX - TILESIZE/2 && gBoxY == exploreY) {
				break;
				}
			
			// playerに到達した場合、位置を返却する
			if (gPlayerX == exploreX && gPlayerY == exploreY) {
				GameOver();
				let dx = 0;
				for(; dx < Math.ceil(WIDTH / TILESIZE); dx++) {
					g.drawImage(gImgSprite, 
						(BinaryOscillator(6, 3)) * 16 + Math.sign(dx) * 32, 80,
						16, 32,
						WIDTH/2 - gPlayerX - TILESIZE/2 + pikupikunX - TILESIZE * (dx + 1), 
						HEIGHT/2 - gPlayerY - TILESIZE/2 + pikupikunY - 8,
						16,32
						)
					g.drawImage(gImgSprite, 
						16 + (((Math.sign(dx) - 1/2) * -1) + 1/2) * (BinaryOscillator(10, 5)) * 32 - Math.sign(dx) * 16, 48,
						16, 32,
						WIDTH/2 - gPlayerX - TILESIZE/2 + pikupikunX - TILESIZE * (dx + 1), 
						HEIGHT/2 - gPlayerY - TILESIZE/2 + pikupikunY - 8,
						16,32
						)
				}
				break;
				}

			

			}
		}
	if (directionPikupikun == 1) {
		exploreY -= TILESIZE
		for (; exploreY > 0; exploreY -= TILESIZE) {
			if (!isGameOver) {
				g.fillRect(WIDTH/2 - gPlayerX - TILESIZE/2 + exploreX, HEIGHT/2 - gPlayerY + exploreY - TILESIZE/2,
			TILESIZE, TILESIZE)
				}

			// boxに到達した場合は終了する
			if (gBoxX == exploreX && gBoxY >= exploreY - TILESIZE/2) {
				break;
				}
			
			// playerに到達した場合、位置を返却する
			if (gPlayerX == exploreX && gPlayerY == exploreY) {
				GameOver();
				let dy = 0;
				for(; dy < Math.ceil(HEIGHT / TILESIZE); dy++) {
					g.drawImage(gImgSprite, 
						Math.sign(dy) * 32, 144 + BinaryOscillator(6, 3) * 16,
						32, 16,
						WIDTH/2 - gPlayerX - TILESIZE + pikupikunX, 
						HEIGHT/2 - gPlayerY - TILESIZE/2 + pikupikunY - TILESIZE * (dy + 1),
						32,16
						)
					g.drawImage(gImgSprite, 
						(((Math.sign(dy) - 1/2) * -1) + 1/2) * (BinaryOscillator(10, 5)) * 32, 128 - Math.sign(dy) * 16,
						32, 16,
						WIDTH/2 - gPlayerX - TILESIZE + pikupikunX, 
						HEIGHT/2 - gPlayerY - TILESIZE/2 + pikupikunY - TILESIZE * (dy + 1),
						32, 16
						)
				}
				break;
				}
			}
		}
	if (directionPikupikun == 2) {
		for (; exploreX <= 16; exploreX += TILESIZE) {
			g.fillRect(WIDTH/2 - gPlayerX - TILESIZE/2 + exploreX, HEIGHT/2 - gPlayerY + exploreY - TILESIZE/2,
			TILESIZE, TILESIZE)

			// boxに到達した場合は終了する
			if (gBoxX <= exploreX + TILESIZE/2 && gBoxY == exploreY) {
				break;
				}
			
			// playerに到達した場合、位置を返却する
			if (gPlayerX == exploreX && gPlayerY == exploreY) {
				GameOver();
				break;
				}
			}
		}
	if (directionPikupikun == 3) {
		for (; exploreY <= 16; exploreX += TILESIZE) {
			g.fillRect(WIDTH/2 - gPlayerX - TILESIZE/2 + exploreX, HEIGHT/2 - gPlayerY + exploreY - TILESIZE/2,
			TILESIZE, TILESIZE)

			// boxに到達した場合は終了する
			if (gBoxX == exploreX - TILESIZE && gBoxY <= exploreY + TILESIZE/2) {
				break;
				}
			
			// playerに到達した場合、位置を返却する
			if (gPlayerX == exploreX && gPlayerY == exploreY) {
				GameOver();
				break;
				}
			}
		}
	}

//	ゲームオーバー処理
function GameOver() {
    if (isGameOver) return; // 二重実行を防止
    isGameOver = true;

    DisableKeyboardInput(); // キー入力を無効化

	PlayLaser();

    // 5秒後に初期化
    setTimeout(() => {
        InitializeEvent(); // ゲーム状態を初期化
        isGameOver = false; // ゲームオーバー状態をリセット
        EnableKeyboardInput(); // キー入力を再有効化
		PlayGameOver();
    }, 6000);
}


//	クリア処理
function StageClear() {
    clear = 1;
    stageNumber++;
    DisableKeyboardInput();
    let sound = PlayStageClear(); // PlayStageClearからAudioオブジェクトを取得

    // 音源の終了時にプレイヤーの座標をリセットするイベントリスナーを追加
    sound.addEventListener('ended', () => {
        console.log("Stage clear sound finished playing");
        EnableKeyboardInput();

        LoadData()
            .then(() => {
                InitializeEvent(); // LoadDataが完了した後に実行
                console.log("Data loaded and initialized.");
            })
            .catch(error => {
                console.error("Error during LoadData:", error);
            });
    });
}


/*
キー処理関数
*/

//	キー入力を無効にする
function DisableKeyboardInput() {
    keyboardDisabled = true;
    console.log("Keyboard disabled.");
	}

//	キー入力を再び有効にする
function EnableKeyboardInput() {
    keyboardDisabled = false;
    console.log("Keyboard enabled.");
	}

//	矢印キーの状態をチェックし、適宜音を制御する関数
function checkKeyAndMove() {
    const arrowKeys = ['ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown'];
    let anyArrowKeyPressed = arrowKeys.some(key => keyState[key]);

    if (anyArrowKeyPressed && gPlayerMoveX === 0 && gPlayerMoveY === 0 && gBoxMoveX == 0 && gBoxMoveY == 0 && keyboardDisabled == false) {
        if (!moveZeroTimer) {
            moveZeroTimer = setTimeout(() => {
				PlaySoundCollision();
                collisionSoundTimer = setInterval(PlaySoundCollision, 1000);
            }, 
		200);
        }
    } else {
        if (moveZeroTimer) {
            clearTimeout(moveZeroTimer);
            moveZeroTimer = null;
        }
        if (collisionSoundTimer) {
            clearInterval(collisionSoundTimer);
            collisionSoundTimer = null;
        }
    }
	}

function MoveLeft() {
	gKey[ 37 ] = true;
	setTimeout(() => {
        gKey[ 37 ] = false;
    }, 100);
}

function MoveUp() {
	gKey[ 38 ] = true;
	setTimeout(() => {
        gKey[ 38 ] = false;
    }, 100);
}

function MoveRight() {
	gKey[ 39 ] = true;
	setTimeout(() => {
        gKey[ 39 ] = false;
    }, 100);
}

function MoveDown() {
	gKey[ 40 ] = true;
	setTimeout(() => {
        gKey[ 40 ] = false;
    }, 100);
}

//	キー入力処理(上下左右)　この関数長すぎるから別のモジュールに移管したほうが良い
function TickField()	{

	if( gPlayerMoveX != 0 || gPlayerMoveY != 0 || keyboardDisabled == true || gBoxMoveX != 0 || gBoxMoveY != 0){}				//	移動中の場合
	else if( gKey[ 37 ] ){	gAngle = 3;	gPlayerMoveX = -TILESIZE; stepCounter++	}	//	左
	else if( gKey[ 38 ] ){	gAngle = 0;	gPlayerMoveY = -TILESIZE; stepCounter++	}	//	上
	else if( gKey[ 39 ] ){	gAngle = 2;	gPlayerMoveX =  TILESIZE; stepCounter++	}	//	右
	else if( gKey[ 40 ] ){	gAngle = 1;	gPlayerMoveY =  TILESIZE; stepCounter++	}	//	下

	let		mPlayerX = Math.floor( ( gPlayerX + gPlayerMoveX ) / TILESIZE );	//	移動後のタイル座標X
	let		mPlayerY = Math.floor( ( gPlayerY + gPlayerMoveY ) / TILESIZE );	//	移動後のタイル座標Y
	let		mPlayerMap = gMap[ mPlayerY * MAP_WIDTH + mPlayerX ];				//	プレイヤーの位置するタイル番号
	let		mPlayerSprite = gSprite[ mPlayerY * MAP_WIDTH + mPlayerX ];			//	プレイヤーの位置するスプライト番号

	//	壁・敵・箱には進入できない
	if( mPlayerMap > 3 || mPlayerSprite == "P" || (mPlayerX * TILESIZE == gBoxX && mPlayerY * TILESIZE == gBoxY)){									//	侵入不可の地形の場合
		ProhibitEntry();
		stepCounter--
	}

	gPlayerX += Math.sign( gPlayerMoveX ) * SCROLL;				//	プレイヤー座標移動X
	gPlayerY += Math.sign( gPlayerMoveY ) * SCROLL;				//	プレイヤー座標移動Y
	gPlayerMoveX -= Math.sign( gPlayerMoveX ) * SCROLL;					//	移動量消費X
	gPlayerMoveY -= Math.sign( gPlayerMoveY ) * SCROLL;					//	移動量消費Y

	//	移動先が箱なら箱を動かす
	if (mPlayerX * TILESIZE == gBoxX && mPlayerY * TILESIZE == gBoxY) {
		ProhibitEntry();
		if( gBoxMoveX == 0 && gBoxMoveY == 0 ){
			if		( gKey[ 37 ] ) { gBoxMoveX = -TILESIZE;}	//	左
			else if	( gKey[ 38 ] ) { gBoxMoveY = -TILESIZE;}	//	上
			else if	( gKey[ 39 ] ) { gBoxMoveX =  TILESIZE;}	//	右
			else if	( gKey[ 40 ] ) { gBoxMoveY =  TILESIZE;}	//	下
			}
	}

	//BOX
	let		mBoxX = Math.floor( ( gBoxX + gBoxMoveX ) / TILESIZE );	//	移動後のタイル座標X
	let		mBoxY = Math.floor( ( gBoxY + gBoxMoveY ) / TILESIZE );	//	移動後のタイル座標Y
	let		mBoxMap = gMap[ mBoxY * MAP_WIDTH + mBoxX ];			//	箱の位置するタイル番号
	let		mBoxSprite = gSprite[ mBoxY * MAP_WIDTH + mBoxX ];		//	箱の位置するスプライト番号

	if (mBoxMap > 3 || mBoxSprite != 0) {
		gBoxMoveX = 0;
		gBoxMoveY = 0;
	}

	if (gBoxMoveX == -TILESIZE || gBoxMoveX == TILESIZE || gBoxMoveY == TILESIZE || gBoxMoveY == -TILESIZE) {
		PlaySoundDraggingBox();
	}

	gBoxX += Math.sign( gBoxMoveX ) * (SCROLL / 2);				//	BOX座標移動X
	gBoxY += Math.sign( gBoxMoveY ) * (SCROLL / 2);				//	BOX座標移動Y
	gBoxMoveX -= Math.sign( gBoxMoveX ) * (SCROLL / 2);			//	移動量消費X
	gBoxMoveY -= Math.sign( gBoxMoveY ) * (SCROLL / 2);			//	移動量消費Y

	//	クリア処理
	if(clear == 0 && (indexFlag % MAP_WIDTH) * TILESIZE == gPlayerX && Math.floor(indexFlag / MAP_HEIGHT) * TILESIZE == gPlayerY) {
		StageClear();
	}
	}

/*
コンテンツのロード
*/

function LoadImage()	{
    gImgMap = new Image();
	gImgMap.onload = function() {
        console.log("Map image loaded successfully."); 
    };
    gImgMap.onerror = function() {
        console.error("Error loading the map image.");
    };
    gImgMap.src = gFileMap;
	
    gImgSprite = new Image();
    gImgSprite.onload = function() {
        console.log("Sprite image loaded successfully.");
    };
    gImgSprite.onerror = function() {
        console.error("Error loading the sprite image.");
    };
    gImgSprite.src = gFileSprite;

    gImgBackground = new Image();
	gImgBackground.onload = function() {
        console.log("BG image loaded successfully."); 
    };
    gImgBackground.onerror = function() {
        console.error("Error loading the BG image.");
    };
    gImgBackground.src = gFileBackground;
}

function LoadSound()	{
	soundCollision = new Audio(); soundCollision.src = fileSoundCollision
	soundDraggingBox = new Audio(); soundDraggingBox.src = fileSoundDraggingBox
	soundStageClear = new Audio(); soundStageClear.src = fileSoundStageClear
	soundGameOver = new Audio(); soundGameOver.src = fileSoundGameOver
	soundLaser = new Audio(); soundLaser.src = fileSoundLaser
}

/*
イベント
*/

//	キー入力(DOWN)イベント
window.onkeydown = function( ev )
{
	let		c = ev.keyCode;			//	キーコード取得

	gKey[ c ] = 1;
}

//	キー入力(UP)イベント
window.onkeyup = function( ev )
{
	gKey[ ev.keyCode ] = 0;
}

//	キー状態の更新とチェック関数の定期実行を開始（DOWN）
window.addEventListener("keydown", function (event) {
    if (event.key in keyState) {
        keyState[event.key] = true;
    }
});

//	キー状態の更新とチェック関数の定期実行を開始（UP）
window.addEventListener("keyup", function (event) {
    if (event.key in keyState) {
        keyState[event.key] = false;
    }
});

// 定期的にキーと移動状態をチェック（存在意義が分からないので消しました　←アホ）
setInterval(checkKeyAndMove, 100);  // 100ミリ秒ごとにチェック（衝突状態のカウントに使ってます）

//	ブラウザ起動イベント
window.onload = function () {
	LoadImage();	//	 マップ画像読み込み
	LoadSound();
	LoadData();

	gScreen = document.createElement("canvas");	//	generate virtual display
	gScreen.width = WIDTH;							//	仮想画面の幅を設定
	gScreen.height = HEIGHT;						//	仮想画面の高さを設定

	WmSize();										//	画面サイズ初期化
	window.addEventListener("resize", function () { WmSize() });	//	ブラウザサイズ変更時にWmSize()を呼び出す
	setInterval(function () { WmTimer() }, 33);		//	33ms間隔でWmTimer()を呼び出して画面更新(30.3fps)
}