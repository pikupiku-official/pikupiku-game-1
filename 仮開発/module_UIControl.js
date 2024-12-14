"use strict";
//Superhello world(������)

// BGM�̝ĝ���Ԃ�ێ�����ϝ�
let isBgmPlaying = false;

// BGM�I�u�W�F�N�g�̝�����
const BGM = new Audio('sound/BGM/FC/FC_pikupikuTheme.mp3');

BGM.loop = true;

// BGM�𝧌䂷��֝�
function toggleBGM() {
    if (isBgmPlaying) {
        BGM.pause();
        // UI�̝X�V�Ȃ�
    } else {
        BGM.volume = 0.1;
        BGM.play();
        // UI�̝X�V�Ȃ�
    }
    isBgmPlaying = !isBgmPlaying; // BGM�̝ĝ���Ԃ�؂�ւ�
}

// HTML�̃{�^���Ɗ֝����֘A�t��
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