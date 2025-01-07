"use strict";

/*
declare variables and constants
*/

const FONT_SIZE = 16; // フォントサイズ
let FONT = null;
let globalFontStyle = null;

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
let MAP_HEIGHT = 7;					//	マップの高さ（タイル）
let MAP_WIDTH = 9;					//	マップの幅（タイル）
let START_X = 3;					//	開始位置X
let START_Y = 7;					//	開始位置Y

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

let boxes = []; // BOXの配列を初期化

let gScreen;						//	仮想画面
let gMap00;							//	マップのタイル構成
let gMap01;						//	マップチップを入れる
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

let isSwitched = 0;

let keyboardDisabled = false;

let clear = 0;

const gFileMap = "img/BG_01.png";			//	specify map-chip image
const gFileSprite = "img/sprite.png";	//	specify player image
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

//	Assign tile configuration to gMap00 from mapData.json
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
                const MAPKEY_00 = `mapData00_${stageNumber < 10 ? '0' + stageNumber : stageNumber}`;	//	BG1面
				const MAPKEY_01 = `mapData01_${stageNumber < 10 ? '0' + stageNumber : stageNumber}`;	//	BG2面	
                const SPRITE_KEY = `spriteData_${stageNumber < 10 ? '0' + stageNumber : stageNumber}`;	//	スプライト面
                gMap00 = data[MAPKEY_00];
				gMap01 = data[MAPKEY_01];
                gSprite = data[SPRITE_KEY];
                directionPikupikun = data.directionPikupikun[stageNumber];
                START_X = data.playerStart[stageNumber][0];
                START_Y = data.playerStart[stageNumber][1];
                indexFlag = gSprite.indexOf("F");
				indexPikupikun = findAllIndexes(gSprite, "P");
                MAP_WIDTH = data.mapSize[stageNumber][0] + 1;
                MAP_HEIGHT = data.mapSize[stageNumber][1] + 1;
				initialPlayerAngle = data.playerStart[stageNumber][2];
				console.log(indexPikupikun)

                // BOXデータの初期化
                boxes = [];
                const boxStartData = data.boxStart[stageNumber];
                for (let i = 0; i < boxStartData.length; i += 2) {
                    boxes.push({
                        x: boxStartData[i] * TILESIZE,
                        y: boxStartData[i + 1] * TILESIZE,
                        moveX: 0,
                        moveY: 0
                    });
                }

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
// DrawMain関数の修正
async function DrawMain() {
	const g = gScreen.getContext("2d"); // 仮想画面のコンテキストを取得

	g.drawImage(gImgBackground, 0, 0);	//	render the background image

	DrawSprite.pikupikuOrder = 0;	//	

	//	render stege maps
	for (let dy = 0; dy < MAP_HEIGHT; dy++) {
		for (let dx = 0; dx < MAP_WIDTH; dx++) {
			DrawTile(
				g, 
		 		WIDTH/2 + (dx - 1/2) * TILESIZE - gPlayerX,
				HEIGHT/2 + (dy - 1/2) * TILESIZE - gPlayerY, 
				gMap00[dx + dy * MAP_WIDTH]);
			DrawSprite(
				g, 
		 		WIDTH/2 + (dx - 1/2) * TILESIZE - gPlayerX,
				HEIGHT/2 + (dy - 1/2) * TILESIZE - gPlayerY, 
				gSprite[dx + dy * MAP_WIDTH]);
		}
	}

    // BOXを描画
    for (let box of boxes) {
        g.drawImage(
            gImgSprite,
            48, 32, PLAYERWIDTH, 16,
            (WIDTH - TILESIZE) / 2 + box.x - gPlayerX,
            (HEIGHT - TILESIZE) / 2 + box.y - gPlayerY,
            PLAYERWIDTH, 16
        );
    }

	//　render the player
	g.drawImage(gImgSprite, 
		gAngle * PLAYERWIDTH, 
		( gFrame >> 4 & 1 ) * PLAYERHEIGHT + 304, 
		PLAYERWIDTH, PLAYERHEIGHT,
		(WIDTH - PLAYERWIDTH * 2 + TILESIZE)/2, (HEIGHT - PLAYERHEIGHT * 2 + TILESIZE)/2, 
		PLAYERWIDTH, PLAYERHEIGHT);	//	プレイヤー画像の表示
	
		for (let dy = 0; dy < MAP_HEIGHT; dy++) {
			for (let dx = 0; dx < MAP_WIDTH; dx++) {
				DrawTile(
					g, 
					 WIDTH/2 + (dx - 1/2) * TILESIZE - gPlayerX,
					HEIGHT/2 + (dy - 1/2) * TILESIZE - gPlayerY, 
					gMap01[dx + dy * MAP_WIDTH]);
			}
		}

	if (indexPikupikun && Array.isArray(indexPikupikun)) {
    	for (let n = 0; n < indexPikupikun.length; n++) {
        	ExploreSquare(directionPikupikun[n], 
			(indexPikupikun[n] % MAP_WIDTH) * TILESIZE, 
			Math.floor(indexPikupikun[n] / MAP_WIDTH) * TILESIZE);
    	}
		} else {
   		console.error("indexPikupikun is not defined or not an array.");
		}

/*
*	debug elements
*/
    // フォントスタイルを設定
    if (globalFontStyle) {
        g.font = globalFontStyle;
    } else {
        console.warn("フォントスタイルが未初期化です。デフォルトフォントを使用します。");
        g.font = "16px sans-serif"; // フォールバックとしてデフォルトフォントを使用
    }    

	//	set window color
	g.fillStyle = WINDOWSTYLE;
	g.fillRect(4, 189, 248, 20);

	g.fillStyle = FONTSTYLE;

	const paddedX = String(Math.floor(gPlayerX)).padStart(3, '0'); // gPlayerXを3桁ゼロパディング
	const paddedY = String(Math.floor(gPlayerY)).padStart(3, '0'); // gPlayerYを3桁ゼロパディング
	const paddedStep = String(stepCounter).padStart(4, '0'); // stepCounterを3桁ゼロパディング
	const paddedStage = String(stageNumber).padStart(2, '0'); // stageNumberを3桁ゼロパディング
	const mapValue00 = gMap00[Math.floor(gPlayerY / TILESIZE) * MAP_WIDTH + Math.floor(gPlayerX / TILESIZE)];
	const mapValue01 = gMap01[Math.floor(gPlayerY / TILESIZE) * MAP_WIDTH + Math.floor(gPlayerX / TILESIZE)];

	g.fillText(`x,y=${paddedX}, ${paddedY} 歩数=${paddedStep} s=${paddedStage} m=${mapValue00} ${isGameOver}`, 10, 203);


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
                0 + (BinaryOscillator(90, 6) * 16), 
                TILESIZE, TILESIZE, x, y, TILESIZE, TILESIZE);
        } else if (direction === 2) {
            g.drawImage(gImgSprite,  
                16 - (BinaryOscillator(60, 12) * 16), 
                0 + (BinaryOscillator(60, 12) * 16), 
                TILESIZE, TILESIZE, x, y, TILESIZE, TILESIZE);
        } else {
            g.drawImage(gImgSprite,  
                48 - (BinaryOscillator(80, 6) * 48), 
                0 + (BinaryOscillator(80, 6) * 16), 
                TILESIZE, TILESIZE, x, y, TILESIZE, TILESIZE);
        }
        DrawSprite.pikupikuOrder++; // 次のピクピクンに進む
    }
}
//	レーザー表示
function DrawLaser() {
    
}


//	canvasに映像出力
function WmPaint() {
    DrawMain();

    const ca = document.getElementById("gameDisplay");
    const g = ca.getContext("2d");

    // 仮想画面をスケーリングして描画
    g.drawImage(gScreen, 0, 0, gScreen.width, gScreen.height, 0, 0, gWidth, gHeight);
}


//	ブラウザサイズ変更イベント
function WmSize() {
    const ca = document.getElementById("gameDisplay");
    const scale = window.devicePixelRatio || 1;

    // ウィンドウサイズに基づいて仮想サイズを計算
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight - 100; // 上部の余白を考慮

    let adjustedWidth = windowWidth;
    let adjustedHeight = windowHeight;

    // アスペクト比を維持
    if (adjustedWidth / WIDTH < adjustedHeight / HEIGHT) {
        adjustedHeight = adjustedWidth * HEIGHT / WIDTH;
    } else {
        adjustedWidth = adjustedHeight * WIDTH / HEIGHT;
    }

    // 実際のピクセル数を設定 (scaleを考慮)
    ca.width = Math.floor(adjustedWidth * scale);
    ca.height = Math.floor(adjustedHeight * scale);

    // CSSサイズを設定 (見た目)
    ca.style.width = `${Math.floor(adjustedWidth)}px`;
    ca.style.height = `${Math.floor(adjustedHeight)}px`;

    // 内部描画用の幅と高さをスケーリングに基づいて保存
    gWidth = ca.width / scale;
    gHeight = ca.height / scale;

    const g = ca.getContext("2d");
    g.imageSmoothingEnabled = g.msImageSmoothingEnabled = false; // アンチエイリアス無効化
    g.scale(scale, scale); // 高解像度に対応
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
	if (!keyboardDisabled) {
		LoadData();
		gPlayerX = START_X * TILESIZE;	//	プレイヤー座標X
		gPlayerY = START_Y * TILESIZE;	//	プレイヤー座標Y
		//gBoxX = BOX_X * TILESIZE;	//	プレイヤー座標X
		//gBoxY = BOX_Y * TILESIZE;	//	プレイヤー座標Y
		gAngle = initialPlayerAngle;
		clear = 0;
	}
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
			// boxに到達した場合は終了する
			let boxCollision = boxes.some(box =>
				box.x >= exploreX - TILESIZE / 2 && box.x <= exploreX + TILESIZE / 2 && box.y === exploreY);

			if (boxCollision || gMap00[exploreX/TILESIZE + exploreY * MAP_WIDTH / TILESIZE] > 79 ||  gMap01[exploreX/TILESIZE + exploreY * MAP_WIDTH / TILESIZE] > 79) {
				break;
			}

			if (!isGameOver) {g.fillRect(WIDTH/2 - gPlayerX - TILESIZE/2 + exploreX, HEIGHT/2 - gPlayerY + exploreY - TILESIZE/2, TILESIZE, TILESIZE)
			}

			// playerに到達した場合、位置を返却する
			if (gPlayerX == exploreX && gPlayerY == exploreY) {
				GameOver();
				let dx = 0;
				g.drawImage(gImgSprite,
					32, 384, 16, 16, 
					WIDTH/2 - gPlayerX - TILESIZE/2 + pikupikunX, 
					HEIGHT/2 - gPlayerY - TILESIZE/2 + pikupikunY, 
					16, 16
					)
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
			// boxに到達した場合は終了する
			let boxCollision = boxes.some(box => 
				box.y >= exploreY - TILESIZE / 2 && box.y <= exploreY + TILESIZE / 2 && box.x === exploreX
			);
			if (boxCollision || gMap00[exploreX/TILESIZE + exploreY * MAP_WIDTH / TILESIZE] > 79 ||  gMap01[exploreX/TILESIZE + exploreY * MAP_WIDTH / TILESIZE] > 79) {
				break;
			}

			if (!isGameOver) {
				g.fillRect(WIDTH/2 - gPlayerX - TILESIZE/2 + exploreX, HEIGHT/2 - gPlayerY + exploreY - TILESIZE/2,
			TILESIZE, TILESIZE)
				}
			
			// playerに到達した場合、位置を返却する
			if (gPlayerX == exploreX && gPlayerY == exploreY ) {
				GameOver();
				let dy = 0;
				g.drawImage(gImgSprite,
					0, 384, 16, 16, 
					WIDTH/2 - gPlayerX - TILESIZE/2 + pikupikunX, 
					HEIGHT/2 - gPlayerY - TILESIZE/2 + pikupikunY, 
					16, 16
					)
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
		exploreX += TILESIZE;
			for (; exploreX <= MAP_WIDTH * TILESIZE; exploreX += TILESIZE) {
				// boxに到達した場合は終了する
				let boxCollision = boxes.some(box =>
					box.x >= exploreX - TILESIZE / 2 && box.x <= exploreX + TILESIZE / 2 && box.y === exploreY);
	
				if (boxCollision || gMap00[exploreX/TILESIZE + exploreY * MAP_WIDTH / TILESIZE] > 79 ||  gMap01[exploreX/TILESIZE + exploreY * MAP_WIDTH / TILESIZE] > 79) {
					break;
				}
	
				if (!isGameOver) {g.fillRect(WIDTH/2 - gPlayerX - TILESIZE/2 + exploreX, HEIGHT/2 - gPlayerY + exploreY - TILESIZE/2, TILESIZE, TILESIZE)
				}
	
				// playerに到達した場合、位置を返却する
				if (gPlayerX == exploreX && gPlayerY == exploreY) {
					GameOver();
					let dx = 0;
					//	ガンギマリ描画
					g.drawImage(gImgSprite,
						16, 384, 16, 16, 
						WIDTH/2 - gPlayerX - TILESIZE/2 + pikupikunX, 
						HEIGHT/2 - gPlayerY - TILESIZE/2 + pikupikunY, 
						16, 16
						)
					for(; dx < Math.ceil(WIDTH / TILESIZE); dx++) {
						g.drawImage(gImgSprite, 
							(BinaryOscillator(6, 3)) * 16 + Math.sign(dx) * 32, 208,
							16, 32,
							WIDTH/2 - gPlayerX - TILESIZE/2 + pikupikunX + TILESIZE * (dx + 1), 
							HEIGHT/2 - gPlayerY - TILESIZE/2 + pikupikunY - 8,
							16,32
							)
						g.drawImage(gImgSprite, 
							(((Math.sign(dx) - 1/2) * -1) + 1/2) * (BinaryOscillator(10, 5)) * 32 + Math.sign(dx) * 16, 176,
							16, 32,
							WIDTH/2 - gPlayerX - TILESIZE/2 + pikupikunX + TILESIZE * (dx + 1), 
							HEIGHT/2 - gPlayerY - TILESIZE/2 + pikupikunY - 8,
							16,32
						)
					}
					break;
					}
				}


		}
	if (directionPikupikun == 3) {
		exploreY += TILESIZE
			for (; exploreY <= MAP_HEIGHT * TILESIZE; exploreY += TILESIZE) {
			// boxに到達した場合は終了する
			let boxCollision = boxes.some(box => 
				box.y >= exploreY - TILESIZE / 2 && box.y <= exploreY + TILESIZE / 2 && box.x === exploreX
			);
			if (boxCollision || gMap00[exploreX/TILESIZE + exploreY * MAP_WIDTH / TILESIZE] > 79 ||  gMap01[exploreX/TILESIZE + exploreY * MAP_WIDTH / TILESIZE] > 79) {
				break;
			}

			if (!isGameOver) {
				g.fillRect(WIDTH/2 - gPlayerX - TILESIZE/2 + exploreX, HEIGHT/2 - gPlayerY + exploreY - TILESIZE/2,
			TILESIZE, TILESIZE)
				}
			
			// playerに到達した場合、位置を返却する
			if (gPlayerX == exploreX && gPlayerY == exploreY ) {
				GameOver();
				let dy = 0;
				g.drawImage(gImgSprite,
					48, 384, 16, 16, 
					WIDTH/2 - gPlayerX - TILESIZE/2 + pikupikunX, 
					HEIGHT/2 - gPlayerY - TILESIZE/2 + pikupikunY, 
					16, 16
					)
				for(; dy < Math.ceil(HEIGHT / TILESIZE); dy++) {
					g.drawImage(gImgSprite, 
						Math.sign(dy) * 32, 272 + BinaryOscillator(6, 3) * 16,
						32, 16,
						WIDTH/2 - gPlayerX - TILESIZE + pikupikunX, 
						HEIGHT/2 - gPlayerY - TILESIZE/2 + pikupikunY + TILESIZE * (dy + 1),
						32,16
						)
					g.drawImage(gImgSprite, 
						(((Math.sign(dy) - 1/2) * -1) + 1/2) * (BinaryOscillator(10, 5)) * 32, 240 + Math.sign(dy) * 16,
						32, 16,
						WIDTH/2 - gPlayerX - TILESIZE + pikupikunX, 
						HEIGHT/2 - gPlayerY - TILESIZE/2 + pikupikunY + TILESIZE * (dy + 1),
						32, 16
						)
				}
				break;
				}
			}
		}
	}


//	スイッチ
function ChangeDirectionPikupikun() {
	if (isSwitched === 3) {isSwitched = 0;} else {isSwitched += 1;}
    for (let i = 0; i < directionPikupikun.length; i++) {
        if (directionPikupikun[i] >= 0 && directionPikupikun[i] <= 3) {
            directionPikupikun[i] = (directionPikupikun[i] + 1) % 4;
        } else {
            throw new Error("Array elements must be between 0 and 3.");
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
		EnableKeyboardInput(); // キー入力を再有効化
        InitializeEvent(); // ゲーム状態を初期化
        isGameOver = false; // ゲームオーバー状態をリセット
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

    // すべてのボックスの移動状態を確認
    let allBoxesStationary = boxes.every(box => box.moveX === 0 && box.moveY === 0);

    if (anyArrowKeyPressed && gPlayerMoveX === 0 && gPlayerMoveY === 0 && allBoxesStationary && !keyboardDisabled) {
        if (!moveZeroTimer) {
            moveZeroTimer = setTimeout(() => {
                PlaySoundCollision();
                collisionSoundTimer = setInterval(PlaySoundCollision, 1000);
            }, 200);
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
function TickField() {
    // プレイヤーが移動中、または入力が無効の場合は何もしない

	if (gPlayerMoveX !== 0 || gPlayerMoveY !== 0 || keyboardDisabled || boxes.some(box => box.moveX !== 0 || box.moveY !== 0)) {
	} else if (gKey[37]) { // 左
        gAngle = 3;
        gPlayerMoveX = -TILESIZE;
		setTimeout(() => {		//	この直後に「移動やっぱやーめた」イベントがあるんだが、そこで「やっぱやめた」のに歩数が加算されるのを防ぐため。
			if (gPlayerMoveX !== 0)
			stepCounter++;
		}, 3);
        
    } else if (gKey[38]) { // 上
        gAngle = 0;
        gPlayerMoveY = -TILESIZE;
		setTimeout(() => {
			if (gPlayerMoveY !== 0)
			stepCounter++;
		}, 3);
    } else if (gKey[39]) { // 右
        gAngle = 2;
        gPlayerMoveX = TILESIZE;
		setTimeout(() => {
			if (gPlayerMoveX !== 0)
			stepCounter++;
		}, 3);
    } else if (gKey[40]) { // 下
        gAngle = 1;
        gPlayerMoveY = TILESIZE;
		setTimeout(() => {
			if (gPlayerMoveY !== 0)
			stepCounter++;
		}, 3);
    }




    // 移動後のタイル座標を計算
    let mPlayerX = Math.floor((gPlayerX + gPlayerMoveX) / TILESIZE);
    let mPlayerY = Math.floor((gPlayerY + gPlayerMoveY) / TILESIZE);
    let mPlayerMap00 = gMap00[mPlayerY * MAP_WIDTH + mPlayerX];
	let mPlayerMap01 = gMap01[mPlayerY * MAP_WIDTH + mPlayerX];
    let mPlayerSprite = gSprite[mPlayerY * MAP_WIDTH + mPlayerX];

    // 壁や敵、ボックスに進入できないようにする

		if (mPlayerMap00 > 79 || mPlayerMap01 > 79 || mPlayerSprite === "P" || boxes.some(box => box.x === mPlayerX * TILESIZE && box.y === mPlayerY * TILESIZE) || boxes.some(box => box.moveX !== 0 || box.moveY !== 0)) {
        	ProhibitEntry();
			if(boxes.some(box => box.moveX === TILESIZE || box.moveY === TILESIZE)){}
			//stepCounter--; // 進入できない場合は歩数を元に戻す
	 	}


	

    // プレイヤー座標を更新
    gPlayerX += Math.sign(gPlayerMoveX) * SCROLL;
    gPlayerY += Math.sign(gPlayerMoveY) * SCROLL;
    gPlayerMoveX -= Math.sign(gPlayerMoveX) * SCROLL;
    gPlayerMoveY -= Math.sign(gPlayerMoveY) * SCROLL;

    // ボックスがある場合の処理
    for (let box of boxes) {
        if (box.x === mPlayerX * TILESIZE && box.y === mPlayerY * TILESIZE) {
            ProhibitEntry(); // プレイヤーの移動を禁止
            // ボックスが動いていない場合のみ移動を設定
            if (box.moveX === 0 && box.moveY === 0) {
                if (gKey[37]) { box.moveX = -TILESIZE; } // 左
                else if (gKey[38]) { box.moveY = -TILESIZE;} // 上
                else if (gKey[39]) { box.moveX = TILESIZE; } // 右
                else if (gKey[40]) { box.moveY = TILESIZE; } // 下
				
            }
			
        }

        // ボックスの移動先をチェック
        let mBoxX = Math.floor((box.x + box.moveX) / TILESIZE);
        let mBoxY = Math.floor((box.y + box.moveY) / TILESIZE);
        let mBoxMap00 = gMap00[mBoxY * MAP_WIDTH + mBoxX];
		let mBoxMap01 = gMap01[mBoxY * MAP_WIDTH + mBoxX];
        let mBoxSprite = gSprite[mBoxY * MAP_WIDTH + mBoxX];

		let boxCollision = boxes.some(otherBox => 
            otherBox !== box && otherBox.x === mBoxX * TILESIZE && otherBox.y === mBoxY * TILESIZE
        );

        if (mBoxMap00 > 79 || mBoxMap01 > 79 || mBoxSprite !== 0 || boxCollision) { // 障害物または他のボックスがある場合
            box.moveX = 0;
            box.moveY = 0;
        }

		if(box.moveX === -TILESIZE || box.moveY === -TILESIZE || box.moveX === TILESIZE || box.moveY === TILESIZE) {
			PlaySoundDraggingBox();
		}

        // ボックスの移動を更新
        box.x += Math.sign(box.moveX) * (SCROLL / 2);
        box.y += Math.sign(box.moveY) * (SCROLL / 2);
        box.moveX -= Math.sign(box.moveX) * (SCROLL / 2);
        box.moveY -= Math.sign(box.moveY) * (SCROLL / 2);
    }

    // クリア処理
    if (clear === 0 && gPlayerX === indexFlag % MAP_WIDTH * TILESIZE && gPlayerY === Math.floor(indexFlag / MAP_HEIGHT) * TILESIZE) {
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

// Google Fontsのリンクを動的に追加する関数
function loadGoogleFont(fontName) {
    const link = document.createElement("link");
    const formattedFontName = fontName.replace(/ /g, "+");
    link.href = `https://fonts.googleapis.com/css2?family=${formattedFontName}&display=swap`;
    link.rel = "stylesheet";
    document.head.appendChild(link);
}

// フォントをロードし、グローバル変数に保存する関数
async function initializeFont(fontName, fontSize) {
    loadGoogleFont(fontName); // Google Fontsをロード
    try {
        await document.fonts.load(`${fontSize}px ${fontName}`);
        console.log(`${fontName} フォントがロードされました。`);
        globalFontStyle = `${fontSize}px ${fontName}`; // フォントスタイルをグローバルに保存
    } catch (error) {
        console.error("フォントのロードに失敗しました:", error);
        globalFontStyle = `${fontSize}px sans-serif`; // フォールバックフォント
    }
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

// 定期的にキーと移動状態をチェック（存在意義が分からないので消しました　←分かったので戻しました）
setInterval(checkKeyAndMove, 100);  // 100ミリ秒ごとにチェック（衝突状態のカウントに使ってます）

//	ブラウザ起動イベント
window.onload = async function () {
    LoadImage(); // 画像読み込み
    LoadSound(); // サウンド読み込み
    LoadData();  // データ読み込み

    const scale = window.devicePixelRatio || 1; // スケールを取得

    gScreen = document.createElement("canvas"); // 仮想画面生成
    gScreen.width = WIDTH; // 仮想画面の幅
    gScreen.height = HEIGHT; // 仮想画面の高さ
    document.body.appendChild(gScreen);

    // フォントを動的に設定
    const adjustedFontSize = Math.floor(24 / scale); // 16pxを基準にスケール調整
    await initializeFont("DotGothic16", adjustedFontSize); // フォントをロード

    WmSize(); // 初期サイズ設定
    window.addEventListener("resize", WmSize); // リサイズイベントに対応

    setInterval(WmTimer, 33); // ゲームループ開始（約30fps）
};
