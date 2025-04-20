// routes/matchmakingRoutes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { joinQueue, leaveQueue } = require('../controllers/matchmakingController');

router.post('/', authMiddleware, joinQueue);
router.delete('/', authMiddleware, leaveQueue);

module.exports = router;
