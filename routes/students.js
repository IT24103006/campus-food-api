const express = require('express');
const Student = require('../models/Student');
const router = express.Router();

// POST /students – create a student
router.post('/', async (req, res) => {
    try {
        const student = new Student(req.body);
        const saved = await student.save();
        res.status(201).json(saved);
    } catch (err) {
        console.error('Error creating student:', err.message);
        res.status(400).json({ error: err.message });
    }
});

// GET /students/:id – get student by ID
router.get('/:id', async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);
        if (!student) return res.status(404).json({ error: 'Student not found' });
        res.json(student);
    } catch (err) {
        console.error('Error fetching student:', err.message);
        res.status(400).json({ error: 'Invalid student ID' });
    }
});

module.exports = router;
