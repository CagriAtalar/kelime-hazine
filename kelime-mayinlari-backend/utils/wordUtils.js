const fs = require('fs');
const path = require('path');
const GameState = require('../models/GameState');
const Game = require('../models/Game');
const UserStatistics = require('../models/UserStatistics');

// ✅ Türkçe kelimeleri dosyadan oku
let TURKISH_WORDS = new Set();

const loadWords = () => {
    try {
        const filePath = path.join(__dirname, '../data/turkce_kelime_listesi.txt');
        const data = fs.readFileSync(filePath, 'utf8');

        const cleanedWords = data
            .split('\n')
            .map(w => w.trim().toUpperCase())
            .filter(w => /^[A-ZÇĞİÖŞÜ]{2,}$/.test(w)); // En az 2 harf ve geçerli karakterler

        TURKISH_WORDS = new Set(cleanedWords);
        console.log(`✅ ${TURKISH_WORDS.size} adet Türkçe kelime yüklendi.`);
    } catch (err) {
        console.error('❌ Kelime listesi yüklenemedi:', err.message);
    }
};

loadWords();
exports.TURKISH_WORDS = TURKISH_WORDS;

// ✅ Oyun başlatıldığında boş state oluştur
exports.initializeGameState = (gameId, p1, p2) => {
    const letterPool = exports.shuffleLetters();
    const p1Hand = letterPool.splice(0, 7);
    const p2Hand = letterPool.splice(0, 7);

    const emptyMatrix = () => Array(15).fill(null).map(() => Array(15).fill(''));

    return {
        gameId,
        currentTurn: Math.random() < 0.5 ? p1 : p2,
        turnStartTime: new Date(),
        letterPool,
        player1Id: p1,
        player2Id: p2,
        player1Hand: p1Hand,
        player2Hand: p2Hand,
        player1Score: 0,
        player2Score: 0,
        boardState: emptyMatrix(),
        boardSpecialTiles: emptyMatrix(),
        boardMines: emptyMatrix(),
        boardRewards: emptyMatrix(),
        player1Rewards: [],
        player2Rewards: [],
        consecutivePasses: 0,
        areaRestriction: null,
        frozenLetters: null,
        extraMovePending: null
    };
};

// ✅ Harf havuzu oluştur
exports.shuffleLetters = () => {
    const freq = { A: 12, B: 2, C: 2, Ç: 1, D: 5, E: 8, F: 1, G: 3, Ğ: 1, H: 1, I: 5, İ: 5, J: 1, K: 6, L: 6, M: 3, N: 5, O: 3, Ö: 1, P: 2, R: 6, S: 6, Ş: 2, T: 5, U: 3, Ü: 2, V: 1, Y: 3, Z: 1 };

    let pool = [];
    for (const [letter, count] of Object.entries(freq)) {
        for (let i = 0; i < count; i++) pool.push(letter);
    }

    for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    return pool;
};

// ✅ Kelime doğrulama ve tahtaya yerleştirme
exports.validateAndPlaceWord = async (userId, gameId, word, { x, y }, direction) => {
    const state = await GameState.findOne({ gameId });
    if (!state) throw { status: 404, message: 'Game not found' };
    if (state.currentTurn.toString() !== userId) throw { status: 400, message: 'Not your turn' };

    const W = word.toUpperCase();
    if (!TURKISH_WORDS.has(W)) throw { status: 400, message: 'Kelime sözlükte yok' };

    const board = state.boardState;
    const isPlayer1 = state.player1Id.toString() === userId;
    let hand = isPlayer1 ? [...state.player1Hand] : [...state.player2Hand];

    for (const letter of W) {
        const idx = hand.indexOf(letter);
        if (idx !== -1) hand.splice(idx, 1);
        else {
            const jIdx = hand.indexOf('JOKER');
            if (jIdx !== -1) hand.splice(jIdx, 1);
            else throw { status: 400, message: 'Yeterli harf yok' };
        }
    }

    for (let i = 0; i < W.length; i++) {
        const row = direction === 'vertical' ? y + i : y;
        const col = direction === 'horizontal' ? x + i : x;
        if (board[row][col] === '') board[row][col] = W[i];
    }

    while (hand.length < 7 && state.letterPool.length > 0) {
        const next = state.letterPool.splice(Math.floor(Math.random() * state.letterPool.length), 1)[0];
        hand.push(next);
    }

    if (isPlayer1) {
        state.player1Hand = hand;
        state.player1Score += W.length;
    } else {
        state.player2Hand = hand;
        state.player2Score += W.length;
    }

    state.boardState = board;
    state.currentTurn = isPlayer1 ? state.player2Id : state.player1Id;
    state.turnStartTime = new Date();
    state.consecutivePasses = 0;
    await state.save();

    return {
        success: true,
        score: W.length,
        newHand: hand,
        newRewards: []
    };
};

// ✅ Oyunu tamamla
exports.finalizeGame = async (gameId) => {
    const game = await Game.findById(gameId);
    const state = await GameState.findOne({ gameId });

    const p1 = state.player1Score;
    const p2 = state.player2Score;
    let winner = null;
    if (p1 > p2) winner = state.player1Id;
    else if (p2 > p1) winner = state.player2Id;

    game.status = 'completed';
    game.winnerId = winner;
    game.endTime = new Date();
    await game.save();

    const p1stats = { gamesPlayed: 1 };
    const p2stats = { gamesPlayed: 1 };
    if (!winner) {
        p1stats.gamesDrawn = 1;
        p2stats.gamesDrawn = 1;
    } else if (winner.toString() === state.player1Id.toString()) {
        p1stats.gamesWon = 1;
        p2stats.gamesLost = 1;
    } else {
        p2stats.gamesWon = 1;
        p1stats.gamesLost = 1;
    }

    await UserStatistics.updateOne({ userId: state.player1Id }, { $inc: p1stats });
    await UserStatistics.updateOne({ userId: state.player2Id }, { $inc: p2stats });
};

// (isteğe bağlı) ödül sistemini buradan genişletebilirsin
exports.applyReward = async (userId, gameId, rewardId) => {
    return true;
};
