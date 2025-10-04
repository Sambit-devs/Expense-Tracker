// backend/server.js
const express = require('express');
const mongoose = require('mongoose');
const { body, param, validationResult } = require('express-validator');
const cors = require('cors');
const Expense = require('./models/Expense');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const MONGODB_URI = process.env.MONGODB_URI || 'your-mongodb-atlas-uri-here';
const PORT = process.env.PORT || 4000;

mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch(err => { console.error('MongoDB connection error:', err); process.exit(1); });

const formatValidation = (req) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return { ok: false, errors: errors.array().map(e => ({ param: e.param, msg: e.msg })) };
  }
  return { ok: true };
};

app.post('/api/expenses',
  body('amount').isFloat({ gt: 0 }).withMessage('Amount must be positive'),
  body('date').isISO8601().withMessage('Date must be valid ISO date'),
  body('note').optional().isString().isLength({ max: 500 }).withMessage('Note too long'),
  body('currency').optional().isString().isLength({ max: 10 }).withMessage('Currency too long'),
  async (req, res) => {
    const v = formatValidation(req);
    if (!v.ok) return res.status(400).json({ error: 'validation', details: v.errors });
    try {
      const { amount, date, note, currency } = req.body;
      const expense = new Expense({ amount, date: new Date(date), note, currency });
      await expense.save();
      return res.status(201).json(expense);
    } catch (err) {
      return res.status(500).json({ error: 'server_error', message: 'Could not save expense' });
    }
  }
);

app.get('/api/expenses', async (req, res) => {
  try {
    const docs = await Expense.find({}).sort({ date: -1 }).limit(100);
    return res.json(docs);
  } catch (err) {
    return res.status(500).json({ error: 'server_error' });
  }
});

app.put('/api/expenses/:id',
  param('id').isMongoId().withMessage('Invalid id'),
  body('amount').optional().isFloat({ gt: 0 }).withMessage('Amount must be positive'),
  body('date').optional().isISO8601().withMessage('Date must be valid ISO date'),
  body('currency').optional().isString().isLength({ max: 10 }).withMessage('Currency too long'),
  async (req, res) => {
    const v = formatValidation(req);
    if (!v.ok) return res.status(400).json({ error: 'validation', details: v.errors });
    try {
      const { id } = req.params;
      const updates = req.body;
      const updated = await Expense.findByIdAndUpdate(id, updates, { new: true });
      if (!updated) return res.status(404).json({ error: 'not_found' });
      return res.json(updated);
    } catch (err) {
      return res.status(500).json({ error: 'server_error' });
    }
  }
);

app.delete('/api/expenses/:id',
  param('id').isMongoId().withMessage('Invalid id'),
  async (req, res) => {
    const v = formatValidation(req);
    if (!v.ok) return res.status(400).json({ error: 'validation', details: v.errors });
    try {
      const { id } = req.params;
      const deleted = await Expense.findByIdAndDelete(id);
      if (!deleted) return res.status(404).json({ error: 'not_found' });
      return res.json({ success: true });
    } catch (err) {
      return res.status(500).json({ error: 'server_error' });
    }
  }
);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));