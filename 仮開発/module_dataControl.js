"use strict";

function SaveGame() {
    // データをlocalStorageに保存
    localStorage.clear();
    localStorage.setItem('stepCounter', stepCounter); // キーを文字列として指定
    localStorage.setItem('stageNumber', stageNumber); // キーを文字列として指定
    // localStorage.setItem('gPlayerX', gPlayerX);
    // localStorage.setItem('gPlayerY', gPlayerY);
    // localStorage.setItem('gAngle', gAngle);
    // localStorage.setItem('boxes', boxes);
    console.log("The data saved. step: " + localStorage.getItem('stepCounter') + " stage: " + localStorage.getItem('stageNumber')
    );
}

async function LoadGame() {
    // データをlocalStorageから読み込み
    stepCounter = parseInt(localStorage.getItem('stepCounter')) || 0; // データがnullの場合はデフォルト値を設定
    stageNumber = parseInt(localStorage.getItem('stageNumber')) || 0; // データがnullの場合はデフォルト値を設定
    // gPlayerX = parseInt(localStorage.getItem('gPlayerX')) || 48;
    // gPlayerY = parseInt(localStorage.getItem('gPlayerY')) || 112;
    // gAngle = parseInt(localStorage.getItem('gAngle')) || 0;
    // boxes = parseInt(localStorage.getItem('boxes')) || 0;
    console.log("The data loaded. step: " + stepCounter + " stage: " + stageNumber + " player: " + gPlayerX + ", " + gPlayerY);
    await LoadData();
    gPlayerX = START_X * TILESIZE;	//	プレイヤー座標X
    gPlayerY = START_Y * TILESIZE;	//	プレイヤー座標Y
    gAngle = initialPlayerAngle;
    clear = 0;
}