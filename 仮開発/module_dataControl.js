"use strict";

function SaveGame() {
    // �f�[�^��localStorage�ɕۑ�
    localStorage.setItem('stepCounter', stepCounter); // �L�[�𕶎���Ƃ��Ďw��
    localStorage.setItem('stageNumber', stageNumber); // �L�[�𕶎���Ƃ��Ďw��
    localStorage.setItem('gPlayerX', gPlayerX);
    localStorage.setItem('gPlayerY', gPlayerY);
    localStorage.setItem('gAngle', gAngle);
    console.log("The data saved. step: " + localStorage.getItem('stepCounter') + " stage: " + localStorage.getItem('stageNumber') + 
    " player: " + localStorage.getItem('gPlayerX') + ", " + localStorage.getItem('gPlayerY'));
}

function LoadGame() {
    // �f�[�^��localStorage����ǂݍ���
    stepCounter = parseInt(localStorage.getItem('stepCounter')) || 0; // �f�[�^��null�̏ꍇ�̓f�t�H���g�l��ݒ�
    stageNumber = parseInt(localStorage.getItem('stageNumber')) || 0; // �f�[�^��null�̏ꍇ�̓f�t�H���g�l��ݒ�
    gPlayerX = parseInt(localStorage.getItem('gPlayerX')) || 48;
    gPlayerY = parseInt(localStorage.getItem('gPlayerY')) || 112;
    gAngle = parseInt(localStorage.getItem('gAngle')) || 0;
    console.log("The data loaded. step: " + stepCounter + " stage: " + stageNumber + " player: " + gPlayerX + ", " + gPlayerY);
    LoadData();
}