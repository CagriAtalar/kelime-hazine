const Game = require('../models/Game');
const GameState = require('../models/GameState');
const UserStatistics = require('../models/UserStatistics');
const { validateWord, checkDictionary, calculateScore } = require('../utils/gameLogic');
const { harfDagilimi } = require('../utils/harfler');
const UserSocket = require('../models/UserSocket');
const { finalizeGame } = require('../utils/wordUtils'); // finalize için (pasla biten oyun)
const logger = require('../utils/logger');

// 📄 Listele: Kullanıcının aktif ve tamamlanan oyunları
exports.listGames = async (req, res) => {
    logger.info('GET /api/game');
    try {
        const userId = req.user.userId;

        const activeGames = await Game.find({
            status: 'active',
            players: userId
        });

        const active = await Promise.all(
            activeGames.map(async (g) => {
                const state = await GameState.findOne({ gameId: g._id });
                return {
                    gameId: g._id,
                    opponentUsername: (await g.players.find((id) => id.toString() !== userId)).toString(),
                    timeOption: g.timeOption,
                    isYourTurn: state.currentTurn.toString() === userId
                };
            })
        );

        const completedGames = await Game.find({
            status: { $in: ['completed', 'abandoned'] },
            players: userId
        });

        const completed = completedGames.map((g) => {
            const result = g.winnerId == null
                ? 'draw'
                : g.winnerId.toString() === userId
                    ? 'win'
                    : 'loss';
            return {
                gameId: g._id,
                opponentUsername: g.players.find((id) => id.toString() !== userId).toString(),
                result,
                endTime: g.endTime
            };
        });

        logger.success('Games listed successfully');
        res.json({ activeGames: active, completedGames: completed });
    } catch (error) {
        logger.error(`List games error: ${error.message}`);
        res.status(500).json({ error: 'Server error' });
    }
};
exports.useReward = async (req, res) => {
    logger.info(`POST /api/game/${req.params.gameId}/use-reward - body: ${JSON.stringify(req.body)}`);
    try {
        const userId = req.user.userId;
        const { gameId } = req.params;
        const { rewardId } = req.body;

        const state = await GameState.findOne({ gameId });
        if (!state) return res.status(404).json({ error: 'Game not found' });

        const isPlayer1 = state.player1Id.toString() === userId;
        let hand = isPlayer1 ? [...state.player1Hand] : [...state.player2Hand];

        if (state.currentTurn.toString() !== userId) {
            return res.status(403).json({ error: 'Not your turn' });
        }

        // 🎁 Reward Logic
        if (rewardId === 'change_letters') {
            state.letterPool.push(...hand);
            hand = [];
            while (hand.length < 7 && state.letterPool.length > 0) {
                const rand = Math.floor(Math.random() * state.letterPool.length);
                const next = state.letterPool.splice(rand, 1)[0];
                hand.push(next);
            }
        } else if (rewardId === 'extra_letter') {
            if (hand.length >= 7) {
                return res.status(400).json({ error: 'Elde zaten 7 harf var' });
            }
            if (state.letterPool.length === 0) {
                return res.status(400).json({ error: 'Harf havuzu boş' });
            }
            const rand = Math.floor(Math.random() * state.letterPool.length);
            const next = state.letterPool.splice(rand, 1)[0];
            hand.push(next);
        } else if (rewardId === 'add_joker') {
            const index = state.letterPool.indexOf('JOKER');
            if (index === -1) {
                return res.status(400).json({ error: 'JOKER kalmadı' });
            }
            if (hand.length >= 7) {
                return res.status(400).json({ error: 'El dolu, JOKER eklenemez' });
            }
            hand.push('JOKER');
            state.letterPool.splice(index, 1);
        } else {
            return res.status(400).json({ error: 'Geçersiz ödül' });
        }

        if (isPlayer1) state.player1Hand = hand;
        else state.player2Hand = hand;

        await state.save();

        const io = req.app.get('io');
        const UserSocket = require('../models/UserSocket');
        const sockets = await UserSocket.find({ userId: { $in: [state.player1Id, state.player2Id] } });
        for (const s of sockets) {
            io.to(s.socketId).emit('game_state_updated', state);
        }

        res.json({ success: true, updatedHand: hand });
    } catch (error) {
        logger.error(`Use reward error: ${error.message}`);
        res.status(500).json({ error: 'Server error' });
    }
};

// 📄 Oyunun anlık durumunu getir
exports.getGameState = async (req, res) => {
    logger.info(`GET /api/game/${req.params.gameId}`);
    try {
        const userId = req.user.userId;
        const { gameId } = req.params;

        const game = await Game.findById(gameId);
        if (!game || !game.players.includes(userId)) {
            logger.warn(`Game not found or unauthorized access: gameId=${gameId}`);
            return res.status(404).json({ error: 'Game not found' });
        }

        const state = await GameState.findOne({ gameId });
        const opponentId = game.players.find((id) => id.toString() !== userId);

        const view = {
            gameId,
            player: userId,
            opponent: opponentId,
            playerScore:
                state.player1Id.toString() === userId
                    ? state.player1Score
                    : state.player2Score,
            opponentScore:
                state.player1Id.toString() === userId
                    ? state.player2Score
                    : state.player1Score,
            playerHand:
                state.player1Id.toString() === userId
                    ? state.player1Hand
                    : state.player2Hand,
            opponentHandSize:
                state.player1Id.toString() === userId
                    ? state.player2Hand.length
                    : state.player1Hand.length,
            boardState: state.boardState,
            currentTurn: state.currentTurn,
            letterPoolSize: state.letterPool.length,
            playerRewards:
                state.player1Id.toString() === userId
                    ? state.player1Rewards
                    : state.player2Rewards,
            timeOption: game.timeOption,
            turnStartTime: state.turnStartTime,
            gameStatus: game.status,
            winner: game.winnerId,
            winnerUsername: game.winnerId
                ? (await require('../models/User').findById(game.winnerId)).username
                : null,
            isYourTurn: state.currentTurn.toString() === userId,
            timeRemaining: null
        };

        logger.success(`Game state fetched: gameId=${gameId}`);
        res.json(view);
    } catch (error) {
        logger.error(`Get game state error: ${error.message}`);
        res.status(500).json({ error: 'Server error' });
    }
};

// 📄 Kelime koy: oyuncu hamlesi
exports.placeWord = async (req, res) => {
    logger.info(`POST /api/game/${req.params.gameId}/place-word - body: ${JSON.stringify(req.body)}`);
    try {
        const userId = req.user.userId;
        const { gameId } = req.params;
        const { word, startPosition, direction } = req.body;

        const game = await Game.findById(gameId);
        const state = await GameState.findOne({ gameId });

        if (!game || !state) {
            logger.warn(`Game or state not found: gameId=${gameId}`);
            return res.status(404).json({ error: 'Game not found' });
        }

        if (!game.players.includes(userId)) {
            logger.warn('User not part of this game');
            return res.status(403).json({ error: 'You are not part of this game' });
        }

        if (state.currentTurn.toString() !== userId) {
            logger.warn('Not your turn');
            return res.status(403).json({ error: 'Not your turn' });
        }

        const isPlayer1 = state.player1Id.toString() === userId;
        const hand = isPlayer1 ? [...state.player1Hand] : [...state.player2Hand];
        const board = state.boardState;

        if (!validateWord(hand, word)) {
            logger.warn('Hand does not match word');
            return res.status(400).json({ error: 'You do not have the required letters' });
        }

        if (!checkDictionary(word)) {
            logger.warn('Word not in dictionary');
            return res.status(400).json({ error: 'Invalid word (not in dictionary)' });
        }

        const placedTiles = [];
        for (let i = 0; i < word.length; i++) {
            const x = direction === 'horizontal' ? startPosition.x + i : startPosition.x;
            const y = direction === 'vertical' ? startPosition.y + i : startPosition.y;

            if (board[y][x]?.harf) continue;
            board[y][x].harf = word[i];
            placedTiles.push({ row: y, col: x, harf: word[i] });
        }

        const gained = calculateScore(board, placedTiles);

        if (isPlayer1) {
            state.player1Score += gained;
        } else {
            state.player2Score += gained;
        }

        for (const l of word) {
            const idx = hand.indexOf(l);
            if (idx !== -1) hand.splice(idx, 1);
            else {
                const jIdx = hand.indexOf('JOKER');
                if (jIdx !== -1) hand.splice(jIdx, 1);
            }
        }

        while (hand.length < 7 && state.letterPool.length > 0) {
            const rand = Math.floor(Math.random() * state.letterPool.length);
            const next = state.letterPool.splice(rand, 1)[0];
            hand.push(next);
        }

        if (isPlayer1) {
            state.player1Hand = hand;
        } else {
            state.player2Hand = hand;
        }

        state.currentTurn = isPlayer1 ? state.player2Id : state.player1Id;
        state.turnStartTime = new Date();
        state.boardState = board;
        state.consecutivePasses = 0;

        await state.save();

        const io = req.app.get('io');
        const sockets = await UserSocket.find({ userId: { $in: game.players } });
        for (const s of sockets) {
            io.to(s.socketId).emit('game_state_updated', state);
        }

        logger.success(`Word placed successfully: ${word} in gameId=${gameId}`);
        return res.json({ success: true, gainedPoints: gained });
    } catch (error) {
        logger.error(`Place word error: ${error.message}`);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// 📄 Pas geç: hamle sırasını değiştir
exports.passTurn = async (req, res) => {
    logger.info(`POST /api/game/${req.params.gameId}/pass`);
    try {
        const userId = req.user.userId;
        const { gameId } = req.params;

        const state = await GameState.findOne({ gameId });
        if (state.currentTurn.toString() !== userId) {
            logger.warn('Pass turn denied: Not your turn');
            return res.status(400).json({ error: 'Not your turn' });
        }

        state.consecutivePasses += 1;
        if (state.consecutivePasses >= 4) {
            await finalizeGame(gameId);
            logger.success(`Game finalized due to consecutive passes: gameId=${gameId}`);
            return res.json({ success: true, gameOver: true });
        }

        state.currentTurn = state.currentTurn.toString() === state.player1Id.toString()
            ? state.player2Id
            : state.player1Id;
        state.turnStartTime = new Date();
        await state.save();

        logger.success(`Turn passed in gameId=${gameId}`);
        return res.json({ success: true, gameOver: false });
    } catch (error) {
        logger.error(`Pass turn error: ${error.message}`);
        res.status(500).json({ error: 'Server error' });
    }
};

// 📄 Teslim ol: oyunu kaybet
exports.resign = async (req, res) => {
    logger.info(`POST /api/game/${req.params.gameId}/resign`);
    try {
        const userId = req.user.userId;
        const { gameId } = req.params;

        const game = await Game.findById(gameId);
        if (!game || game.status !== 'active') {
            logger.warn(`Resign failed: Game not active or not found - gameId=${gameId}`);
            return res.status(404).json({ error: 'Game not found or not active' });
        }

        const opponentId = game.players.find((id) => id.toString() !== userId);
        game.status = 'completed';
        game.winnerId = opponentId;
        game.endReason = 'resignation';
        game.endTime = new Date();
        await game.save();

        await UserStatistics.updateOne({ userId }, { $inc: { gamesPlayed: 1, gamesLost: 1 } });
        await UserStatistics.updateOne({ userId: opponentId }, { $inc: { gamesPlayed: 1, gamesWon: 1 } });

        logger.success(`Game resigned by user: ${userId} in gameId=${gameId}`);
        res.json({ success: true });
    } catch (error) {
        logger.error(`Resign error: ${error.message}`);
        res.status(500).json({ error: 'Server error' });
    }
};

// 📄 İstatistik çek
exports.getStatistics = async (req, res) => {
    logger.info('GET /api/game/statistics');
    try {
        const userId = req.user.userId;
        const stats = await UserStatistics.findOne({ userId });

        const winPercentage = stats.gamesPlayed > 0
            ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100)
            : 0;

        logger.success('User statistics retrieved');
        res.json({
            gamesPlayed: stats.gamesPlayed,
            gamesWon: stats.gamesWon,
            gamesLost: stats.gamesLost,
            gamesDrawn: stats.gamesDrawn,
            winPercentage
        });
    } catch (error) {
        logger.error(`Get statistics error: ${error.message}`);
        res.status(500).json({ error: 'Server error' });
    }
};
