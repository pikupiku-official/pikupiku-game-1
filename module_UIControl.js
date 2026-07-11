"use strict";
//Superhello world(あさい)

// BGMの敍攜暎態を保持する変摧
let isBgmPlaying = false;
let isSeEnabled = true;
let bgmSecondLoop = false;

// BGMオブジェクトの揄期化
const BGM = new Audio('sound/BGM/FC/FC_pikupikuTheme.mp3');
const BGM_SECOND = new Audio('sound/BGM/FC/FC_pikupikuTheme2.mp3');

BGM.loop = false;
BGM_SECOND.loop = true;
BGM.volume = 0.1;
BGM_SECOND.volume = 0.1;
BGM.addEventListener('ended', () => {
    if (!isBgmPlaying) return;
    bgmSecondLoop = true;
    BGM_SECOND.currentTime = 0;
    BGM_SECOND.play().catch(() => {});
});

// BGMを擧御する関摧
function toggleBGM() {
    if (isBgmPlaying) {
        BGM.pause(); BGM_SECOND.pause();
        // UIの拗抃など
    } else {
        BGM.volume = 0.1;
        (bgmSecondLoop ? BGM_SECOND : BGM).play().catch(() => {});
        // UIの拗抃など
    }
    isBgmPlaying = !isBgmPlaying; // BGMの敍攜暎態を旙り替え
}

function toggleSE() {
    isSeEnabled = !isSeEnabled;
    [soundCollision, soundDraggingBox, soundStageClear, soundGameOver, soundLaser].forEach(a => a && (a.volume = isSeEnabled ? 1 : 0));
}

function stopBGMForStageClear(jingle) {
    const wasPlaying = isBgmPlaying;
    BGM.pause(); BGM_SECOND.pause();
    if (jingle) jingle.addEventListener('ended', () => {
        if (!wasPlaying) return;
        isBgmPlaying = true;
        const audio = bgmSecondLoop ? BGM_SECOND : BGM;
        audio.volume = 0;
        audio.play().catch(() => {});
        let volume = 0;
        const fade = setInterval(() => { volume += 0.02; audio.volume = Math.min(0.1, volume); if (volume >= 0.1) clearInterval(fade); }, 100);
    }, { once: true });
}

function resumeBGMAfterStageClear() {
    if (!isBgmPlaying) return;
    const audio = bgmSecondLoop ? BGM_SECOND : BGM;
    audio.volume = 0;
    audio.play().catch(() => {});
    let volume = 0;
    const fade = setInterval(() => { volume += 0.02; audio.volume = Math.min(0.1, volume); if (volume >= 0.1) clearInterval(fade); }, 100);
}

document.addEventListener('keydown', event => {
    if (event.key.toLowerCase() === 'n' && !event.repeat) { event.preventDefault(); toggleSE(); }
    if (!isBgmPlaying && ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Enter',' '].includes(event.key)) toggleBGM();
});

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
    const button = document.getElementById("switch");
    button.addEventListener('click', ChangeDirectionPikupikun);
});

document.addEventListener('DOMContentLoaded', () => {
    const button = document.getElementById("save");
    button.addEventListener('click', SaveGame);
});

document.addEventListener('DOMContentLoaded', () => {
    const button = document.getElementById("load");
    button.addEventListener('click', LoadGame);
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

