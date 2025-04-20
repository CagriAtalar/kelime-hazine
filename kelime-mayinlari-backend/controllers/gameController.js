// controllers/gameController.js
const Game = require('../models/Game');
const GameState = require('../models/GameState');
const UserStatistics = require('../models/UserStatistics');
const { validateAndPlaceWord, finalizeGame, shuffleLetters } = require('../utils/wordUtils');

exports.listGames = async (req, res) => {
    try {
        const userId = req.user.userId;
        // Active games
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
        // Completed games
        const completedGames = await Game.find({
            status: { $in: ['completed', 'abandoned'] },
            players: userId
        });
        const completed = completedGames.map((g) => {
            const result =
                g.winnerId == null
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
        res.json({ activeGames: active, completedGames: completed });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.getGameState = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { gameId } = req.params;
        const game = await Game.findById(gameId);
        if (!game || !game.players.includes(userId)) {
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
            isYourTurn: state.currentTurn.toString() === userId,
            timeRemaining: null // compute based on timeOption & turnStartTime on client
        };
        res.json(view);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.placeWord = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { gameId } = req.params;
        const { word, startPosition, direction } = req.body;
        const result = await validateAndPlaceWord(
            userId,
            gameId,
            word,
            startPosition,
            direction
        );
        return res.json(result);
    } catch (error) {
        console.error(error);
        if (error.status && error.message) {
            return res.status(error.status).json({ error: error.message });
        }
        res.status(500).json({ error: 'Server error' });
    }
};

exports.passTurn = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { gameId } = req.params;
        const state = await GameState.findOne({ gameId });
        if (state.currentTurn.toString() !== userId) {
            return res.status(400).json({ error: 'Not your turn' });
        }
        state.consecutivePasses += 1;
        if (state.consecutivePasses >= 4) {
            await finalizeGame(gameId);
            return res.json({ success: true, gameOver: true });
        }
        // switch turn
        state.currentTurn = state.currentTurn.toString() === state.player1Id.toString()
            ? state.player2Id
            : state.player1Id;
        state.turnStartTime = new Date();
        await state.save();
        return res.json({ success: true, gameOver: false });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.resign = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { gameId } = req.params;
        const game = await Game.findById(gameId);
        if (!game || game.status !== 'active') {
            return res.status(404).json({ error: 'Game not found or not active' });
        }
        const opponentId = game.players.find((id) => id.toString() !== userId);
        game.status = 'completed';
        game.winnerId = opponentId;
        game.endReason = 'resignation';
        game.endTime = new Date();
        await game.save();
        // Update stats
        await UserStatistics.updateOne(
            { userId },
            { $inc: { gamesPlayed: 1, gamesLost: 1 } }
        );
        await UserStatistics.updateOne(
            { userId: opponentId },
            { $inc: { gamesPlayed: 1, gamesWon: 1 } }
        );
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.useReward = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { gameId } = req.params;
        const { rewardId } = req.body;
        // Implementation of reward logic in utils...
        const success = await require('../utils/wordUtils')
            .applyReward(userId, gameId, rewardId);
        if (!success) {
            return res.status(400).json({ error: 'Invalid reward or not your turn' });
        }
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.getStatistics = async (req, res) => {
    try {
        const userId = req.user.userId;
        const stats = await UserStatistics.findOne({ userId });
        const winPercentage =
            stats.gamesPlayed > 0
                ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100)
                : 0;
        res.json({
            gamesPlayed: stats.gamesPlayed,
            gamesWon: stats.gamesWon,
            gamesLost: stats.gamesLost,
            gamesDrawn: stats.gamesDrawn,
            winPercentage
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};
