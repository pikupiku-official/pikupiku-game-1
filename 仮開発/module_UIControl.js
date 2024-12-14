"use strict";
//Superhello world(あさい)

// BGMの敍攜暎態を保持する変摧
let isBgmPlaying = false;

// BGMオブジェクトの揄期化
const BGM = new Audio('sound/BGM/FC/FC_pikupikuTheme.mp3');

BGM.loop = true;

// BGMを擧御する関摧
function toggleBGM() {
    if (isBgmPlaying) {
        BGM.pause();
        // UIの拗抃など
    } else {
        BGM.volume = 0.1;
        BGM.play();
        // UIの拗抃など
    }
    isBgmPlaying = !isBgmPlaying; // BGMの敍攜暎態を旙り替え
}

// HTMLのボタンと関摧を関連付け
document.addEventListener('DOMContentLoaded', () => {
    const button = document.getElementById("buttonToggleBGM");
    button.addEventListener('click', toggleBGM);
});

document.addEventListener('DOMContentLoaded', () => {
    const button = document.getElementById("initializeEvent");
    button.addEventListener('click', InitializeEvent);
});

document.addEventListener('DOMContentLoaded', () => {
	const buttonLeft = document.getElementById("buttonLeft");
	buttonLeft.addEventListener('click', MoveLeft);
});
document.addEventListener('DOMContentLoaded', () => {
	const buttonUp = document.getElementById("buttonUp");
	buttonUp.addEventListener('click', MoveUp);
});
document.addEventListener('DOMContentLoaded', () => {
	const buttonRight = document.getElementById("buttonRight");
	buttonRight.addEventListener('click', MoveRight);
});
document.addEventListener('DOMContentLoaded', () => {
	const buttonDown = document.getElementById("buttonDown");
	buttonDown.addEventListener('click', MoveDown);
});