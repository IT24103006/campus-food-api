const express = require('express');
const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const router = express.Router();

// Helper: calculate totalPrice from items array
async function calculateTotalPrice(items) {
    const menuItemIds = items.map(i => i.menuItem);
    const menuItems = await MenuItem.find({ _id: { $in: menuItemIds } });

    // Build a price lookup map: id -> price
    const priceMap = {};
    menuItems.forEach(mi => {
        priceMap[mi._id.toString()] = mi.price;
    });

    let total = 0;
    for (const item of items) {
        const price = priceMap[item.menuItem.toString()];
        if (price === undefined) {
            throw new Error(`Invalid menuItem ID: ${item.menuItem}`);
        }
        total += price * item.quantity;
    }
    return total;
}

// POST /orders – place an order
router.post('/', async (req, res) => {
    try {
        const { student, items } = req.body;

        if (!student) {
            return res.status(400).json({ error: 'student is required' });
        }
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'items must be a non-empty array' });
        }

        const totalPrice = await calculateTotalPrice(items);

        const order = new Order({ student, items, totalPrice, status: 'PLACED' });
        const saved = await order.save();

        // Re-fetch with populated references for the response
        const populated = await Order.findById(saved._id)
            .populate('student')
            .populate('items.menuItem');

        res.status(201).json(populated);
    } catch (err) {
        console.error('Error placing order:', err.message);
        res.status(400).json({ error: err.message });
    }
});

// GET /orders – list orders with pagination
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const orders = await Order.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('student')
            .populate('items.menuItem');

        const total = await Order.countDocuments();

        res.json({
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            orders
        });
    } catch (err) {
        console.error('Error fetching orders:', err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /orders/:id – get single order by ID
router.get('/:id', async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('student')
            .populate('items.menuItem');

        if (!order) return res.status(404).json({ error: 'Order not found' });
        res.json(order);
    } catch (err) {
        console.error('Error fetching order:', err.message);
        res.status(400).json({ error: 'Invalid order ID' });
    }
});

// PATCH /orders/:id/status – update order status
router.patch('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const allowed = ['PLACED', 'PREPARING', 'DELIVERED', 'CANCELLED'];

        if (!allowed.includes(status)) {
            return res.status(400).json({ error: `Status must be one of: ${allowed.join(', ')}` });
        }

        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true, runValidators: true }
        )
            .populate('student')
            .populate('items.menuItem');

        if (!order) return res.status(404).json({ error: 'Order not found' });
        res.json(order);
    } catch (err) {
        console.error('Error updating order status:', err.message);
        res.status(400).json({ error: err.message });
    }
});

// DELETE /orders/:id – delete an order
router.delete('/:id', async (req, res) => {
    try {
        const order = await Order.findByIdAndDelete(req.params.id);
        if (!order) return res.status(404).json({ error: 'Order not found' });
        res.json({ message: 'Order deleted successfully' });
    } catch (err) {
        console.error('Error deleting order:', err.message);
        res.status(400).json({ error: 'Invalid order ID' });
    }
});

module.exports = router;
