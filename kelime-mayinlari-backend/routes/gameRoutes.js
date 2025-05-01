// routes/gameRoutes.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const gameCtrl = require('../controllers/gameController');

router.get('/', auth, gameCtrl.listGames);
router.get('/statistics', auth, gameCtrl.getStatistics);
router.get('/:gameId', auth, gameCtrl.getGameState);
router.post('/:gameId/place-word', auth, gameCtrl.placeWord);
router.post('/:gameId/pass', auth, gameCtrl.passTurn);
router.post('/:gameId/resign', auth, gameCtrl.resign);
router.post('/:gameId/use-reward', auth, gameCtrl.useReward);


module.exports = router;
