// controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Session = require('../models/Session');
const UserStatistics = require('../models/UserStatistics');

exports.register = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        // Validation
        if (!username || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        if (password.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters' });
        }
        const exists = await User.findOne({ $or: [{ username }, { email }] });
        if (exists) {
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
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;
        // Validation
        if (!username || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
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
        // Compute win percentage
        const stats = await UserStatistics.findOne({ userId: user._id });
        const winPercentage =
            stats.gamesPlayed > 0
                ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100)
                : 0;
        res.json({
            token,
            user: {
                username: user.username,
                winPercentage
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.logout = async (req, res) => {
    try {
        const userId = req.user.userId;
        await Session.deleteMany({ userId });
        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};
