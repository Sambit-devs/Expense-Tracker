require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const { body, param, validationResult } = require('express-validator');
const cors = require('cors');
const { clerkMiddleware } = require('@clerk/express');
const Expense = require('./models/Expense');

const app = express();
app.use(cors());
app.use(express.json());

const MONGODB_URI = process.env.MONGODB_URI || 'your-mongodb-atlas-uri-here';
console.log('MongoDB URI:', MONGODB_URI);
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

// CRITICAL FIX: Pass both keys explicitly to work around a bug in the SDK.
app.use('/api/expenses', clerkMiddleware({
  secretKey: process.env.CLERK_SECRET_KEY,
  publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
}));

app.post('/api/expenses',
  body('amount').isFloat({ gt: 0 }).withMessage('Amount must be positive'),
  body('date').isISO8601().withMessage('Date must be valid ISO date'),
  body('note').optional().isString().isLength({ max: 500 }).withMessage('Note too long'),
  body('currency').optional().isString().isLength({ max: 10 }).withMessage('Currency too long'),
  body('category').optional().isString().withMessage('Category must be a string'),
  async (req, res) => {
    const v = formatValidation(req);
    if (!v.ok) return res.status(400).json({ error: 'validation', details: v.errors });
    try {
      const { amount, date, note, currency, category } = req.body;
      const userId = req.auth?.userId;
      if (!userId) {
          return res.status(401).json({ error: 'Authentication failed: User ID missing' });
      }
      const expense = new Expense({ amount, date: new Date(date), note, currency, category, userId });
      await expense.save();
      return res.status(201).json(expense);
    } catch (err) {
      console.error("Error saving expense:", err);
      return res.status(500).json({ error: 'server_error', message: 'Could not save expense' });
    }
  }
);

app.get('/api/expenses', async (req, res) => {
  try {
    const { category, startDate, endDate } = req.query;
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication failed: User ID missing' });
    }

    // New pagination parameters with default values
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20; // Default to 20 items per page
    const skip = (page - 1) * limit;

    const filter = { userId: userId };
    if (category) filter.category = category;
    if (startDate && endDate) filter.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    else if (startDate) filter.date = { $gte: new Date(startDate) };
    else if (endDate) filter.date = { $lte: new Date(endDate) };

    const totalCount = await Expense.countDocuments(filter);
    
    const docs = await Expense.find(filter)
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);

    return res.json({
      data: docs,
      meta: {
        totalItems: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
        limit: limit
      }
    });
  } catch (err) {
    console.error("Error in GET /api/expenses:", err);
    return res.status(500).json({ error: 'server_error' });
  }
});

app.put('/api/expenses/:id',
  param('id').isMongoId().withMessage('Invalid id'),
  body('amount').optional().isFloat({ gt: 0 }).withMessage('Amount must be positive'),
  body('date').optional().isISO8601().withMessage('Date must be valid ISO date'),
  body('currency').optional().isString().isLength({ max: 10 }).withMessage('Currency too long'),
  body('category').optional().isString().withMessage('Category must be a string'),
  async (req, res) => {
    const v = formatValidation(req);
    if (!v.ok) return res.status(400).json({ error: 'validation', details: v.errors });
    try {
      const { id } = req.params;
      const userId = req.auth?.userId;
      if (!userId) {
          return res.status(401).json({ error: 'Authentication failed: User ID missing' });
      }
      const updates = req.body;
      const updated = await Expense.findOneAndUpdate({ _id: id, userId: userId }, updates, { new: true });
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
      const userId = req.auth?.userId;
      if (!userId) {
          return res.status(401).json({ error: 'Authentication failed: User ID missing' });
      }
      const deleted = await Expense.findOneAndDelete({ _id: id, userId: userId });
      if (!deleted) return res.status(404).json({ error: 'not_found' });
      return res.json({ success: true });
    } catch (err) {
      return res.status(500).json({ error: 'server_error' });
    }
  }
);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));