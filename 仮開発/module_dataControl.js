"use strict";

function SaveGame() {
    // �f�[�^��localStorage�ɕۑ�
    localStorage.clear();
    localStorage.setItem('stepCounter', stepCounter); // �L�[�𕶎���Ƃ��Ďw��
    localStorage.setItem('stageNumber', stageNumber); // �L�[�𕶎���Ƃ��Ďw��
    // localStorage.setItem('gPlayerX', gPlayerX);
    // localStorage.setItem('gPlayerY', gPlayerY);
    // localStorage.setItem('gAngle', gAngle);
    // localStorage.setItem('boxes', boxes);
    console.log("The data saved. step: " + localStorage.getItem('stepCounter') + " stage: " + localStorage.getItem('stageNumber')
    );
}

async function LoadGame() {
    // �f�[�^��localStorage����ǂݍ���
    stepCounter = parseInt(localStorage.getItem('stepCounter')) || 0; // �f�[�^��null�̏ꍇ�̓f�t�H���g�l��ݒ�
    stageNumber = parseInt(localStorage.getItem('stageNumber')) || 0; // �f�[�^��null�̏ꍇ�̓f�t�H���g�l��ݒ�
    // gPlayerX = parseInt(localStorage.getItem('gPlayerX')) || 48;
    // gPlayerY = parseInt(localStorage.getItem('gPlayerY')) || 112;
    // gAngle = parseInt(localStorage.getItem('gAngle')) || 0;
    // boxes = parseInt(localStorage.getItem('boxes')) || 0;
    console.log("The data loaded. step: " + stepCounter + " stage: " + stageNumber + " player: " + gPlayerX + ", " + gPlayerY);
    await LoadData();
    gPlayerX = START_X * TILESIZE;	//	�v���C���[���WX
    gPlayerY = START_Y * TILESIZE;	//	�v���C���[���WY
    gAngle = initialPlayerAngle;
    clear = 0;
}