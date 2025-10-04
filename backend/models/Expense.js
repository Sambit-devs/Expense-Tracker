// backend/models/Expense.js
const mongoose = require('mongoose');

const ExpenseSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  date: { type: Date, required: true },
  note: { type: String, default: '' },
  currency: { type: String, default: '₹' },
  category: { type: String, default: 'Other' } // New category field
}, { timestamps: true });

module.exports = mongoose.model('Expense', ExpenseSchema);