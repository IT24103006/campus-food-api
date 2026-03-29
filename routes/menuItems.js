const express = require('express');
const MenuItem = require('../models/MenuItem');
const router = express.Router();

// POST /menu-items – create a menu item
router.post('/', async(req, res) => {
    try {
        const menuItem = new MenuItem(req.body);
        const saved = await menuItem.save();
        res.status(201).json(saved);
    } catch (err) {
        console.error('Error creating menu item:', err.message);
        res.status(400).json({ error: err.message });
    }
});

// GET /menu-items – list all menu items (newest first)
router.get('/', async(req, res) => {
    try {
        const items = await MenuItem.find().sort({ createdAt: -1 });
        res.json(items);
    } catch (err) {
        console.error('Error fetching menu items:', err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /menu-items/search?name=...&category=...
// NOTE: this route must be defined BEFORE /:id to avoid conflicts
router.get('/search', async(req, res) => {
    try {
        const { name, category } = req.query;
        const filter = {};

        if (name) {
            filter.name = { $regex: name, $options: 'i' }; // partial, case-insensitive
        }
        if (category) {
            filter.category = category;
        }

        const items = await MenuItem.find(filter).sort({ name: 1 });
        res.json(items);
    } catch (err) {
        console.error('Error searching menu items:', err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;