const fs = require('fs');
const path = require('path');

// Türkçe kelimeler yükleniyor
const kelimeSet = new Set(
    fs.readFileSync(path.join(__dirname, '../data/turkce_kelime_listesi.txt'), 'utf-8')
        .split('\n')
        .map(w => w.trim().toUpperCase())
);

const { harfPuani } = require('./harfler'); // harf puanlarını içeriyor olacak

// ✅ 1. Oyuncunun elindeki harflerle kelime kurabilir mi?
function validateWord(hand, word) {
    const tempHand = [...hand];
    word = word.toUpperCase();

    for (let letter of word) {
        const idx = tempHand.indexOf(letter);
        if (idx !== -1) {
            tempHand.splice(idx, 1);
        } else if (tempHand.indexOf('JOKER') !== -1) {
            tempHand.splice(tempHand.indexOf('JOKER'), 1);
        } else {
            return false;
        }
    }
    return true;
}

// ✅ 2. Kelime Türkçe listede var mı?
function checkDictionary(word) {
    return kelimeSet.has(word.toUpperCase());
}

// ✅ 3. Yerleştirilen taşlardan puan hesapla
function calculateScore(boardState, placedTiles) {
    let kelimeCarpani = 1;
    let skor = 0;

    for (const tile of placedTiles) {
        const cell = boardState[tile.row][tile.col];
        const puan = harfPuani[tile.harf] ?? 0;

        if (cell.type === 'H2') skor += puan * 2;
        else if (cell.type === 'H3') skor += puan * 3;
        else {
            skor += puan;
            if (cell.type === 'K2') kelimeCarpani *= 2;
            if (cell.type === 'K3') kelimeCarpani *= 3;
        }
    }

    return skor * kelimeCarpani;
}

module.exports = {
    validateWord,
    checkDictionary,
    calculateScore
};
