const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Session = require('../models/Session');
const UserStatistics = require('../models/UserStatistics');

// Logger importu
const logger = require('../utils/logger');

exports.register = async (req, res) => {
    logger.info('POST /api/auth/register - body: ' + JSON.stringify(req.body));
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            logger.warn('Register failed: Missing fields');
            return res.status(400).json({ error: 'All fields are required' });
        }
        if (password.length < 8) {
            logger.warn('Register failed: Password too short');
            return res.status(400).json({ error: 'Password must be at least 8 characters' });
        }
        const exists = await User.findOne({ $or: [{ username }, { email }] });
        if (exists) {
            logger.warn('Register failed: Username or email taken');
            return res.status(400).json({ error: 'Username or email already taken' });
        }

        const hashed = await bcrypt.hash(password, 10);
        const user = await User.create({ username, email, password: hashed });

        await UserStatistics.create({
            userId: user._id,
            gamesPlayed: 0,
            gamesWon: 0,
            gamesLost: 0,
            gamesDrawn: 0
        });

        logger.success(`User registered: ${username}`);
        res.status(200).json({ message: 'User registered successfully' });
    } catch (error) {
        logger.error(`Register error: ${error.message}`);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.login = async (req, res) => {
    logger.info('POST /api/auth/login - body: ' + JSON.stringify(req.body));
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            logger.warn('Login failed: Missing fields');
            return res.status(400).json({ error: 'All fields are required' });
        }
        const user = await User.findOne({ username });
        if (!user) {
            logger.warn('Login failed: User not found');
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            logger.warn('Login failed: Incorrect password');
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
            expiresIn: '7d'
        });

        await Session.create({
            userId: user._id,
            token,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        });

        const stats = await UserStatistics.findOne({ userId: user._id });
        const winPercentage =
            stats.gamesPlayed > 0
                ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100)
                : 0;

        logger.success(`User logged in: ${username}`);
        res.json({
            token,
            user: {
                username: user.username,
                winPercentage
            }
        });
    } catch (error) {
        logger.error(`Login error: ${error.message}`);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.logout = async (req, res) => {
    logger.info('POST /api/auth/logout');
    try {
        const userId = req.user.userId;
        await Session.deleteMany({ userId });

        logger.success(`User logged out: ${userId}`);
        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        logger.error(`Logout error: ${error.message}`);
        res.status(500).json({ error: 'Server error' });
    }
};
