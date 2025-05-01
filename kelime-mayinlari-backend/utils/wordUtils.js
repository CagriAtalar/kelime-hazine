// utils/wordUtils.js
const GameState = require('../models/GameState');
const Game = require('../models/Game');
const UserStatistics = require('../models/UserStatistics');
// Stub dictionary; replace with real lookup or API
const TURKISH_WORDS = new Set(['MERHABA', 'TEST', 'KELIME', /* ... */]);

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

exports.shuffleLetters = () => {
    // Build Turkish letter frequency pool
    const freq = { A: 12, B: 2, C: 2, Ç: 1, D: 5, /* ... */ };
    let pool = [];
    for (const [letter, count] of Object.entries(freq)) {
        for (let i = 0; i < count; i++) pool.push(letter);
    }
    // Fisher–Yates shuffle
    for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool;
};

exports.validateAndPlaceWord = async (
    userId,
    gameId,
    word,
    { x, y },
    direction
) => {
    // 1) fetch state
    const state = await GameState.findOne({ gameId });
    if (!state) throw { status: 404, message: 'Game not found' };
    if (state.currentTurn.toString() !== userId) {
        throw { status: 400, message: 'Not your turn' };
    }
    // 2) word uppercase & validation
    const W = word.toUpperCase();
    if (!TURKISH_WORDS.has(W)) {
        throw { status: 400, message: 'Invalid word' };
    }
    // 3) check letter availability, placement rules, board bounds...
    // (omitted for brevity; implement per spec)
    // 4) compute score, handle mines & rewards, update state properties
    // ...
    // 5) draw new letters
    const usedCount = W.length;
    const newLetters = state.letterPool.splice(0, usedCount);
    if (state.player1Id.toString() === userId) {
        state.player1Hand = state.player1Hand.filter((l) => !W.includes(l)).concat(newLetters);
        state.player1Score += usedCount; // dummy scoring
    } else {
        state.player2Hand = state.player2Hand.filter((l) => !W.includes(l)).concat(newLetters);
        state.player2Score += usedCount;
    }
    // 6) switch turn
    state.currentTurn = state.currentTurn.toString() === state.player1Id.toString()
        ? state.player2Id
        : state.player1Id;
    state.turnStartTime = new Date();
    state.consecutivePasses = 0;
    await state.save();
    // 7) check end condition
    if (
        state.letterPool.length === 0 &&
        (state.player1Hand.length === 0 || state.player2Hand.length === 0)
    ) {
        await exports.finalizeGame(gameId);
    }
    // 8) return result
    return {
        success: true,
        score: usedCount,
        newHand:
            state.player1Id.toString() === userId
                ? state.player1Hand
                : state.player2Hand,
        newRewards: []
    };
};

exports.finalizeGame = async (gameId) => {
    const game = await Game.findById(gameId);
    const state = await GameState.findOne({ gameId });
    // compute final scores (deduct letters from loser)
    const p1 = state.player1Score;
    const p2 = state.player2Score;
    let winner = null;
    if (p1 > p2) winner = state.player1Id;
    else if (p2 > p1) winner = state.player2Id;
    game.status = 'completed';
    game.winnerId = winner;
    game.endTime = new Date();
    await game.save();
    // update stats
    const p1stats = { gamesPlayed: 1 };
    const p2stats = { gamesPlayed: 1 };
    if (winner == null) {
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

exports.applyReward = async (userId, gameId, rewardId) => {
    // implement reward usage logic...
    return true;
};
