// frontend/src/ExpenseTrackerApp.jsx
import React, { useEffect, useState } from 'react';

const API_BASE = 'http://localhost:4000/api';

const currencies = [
  { symbol: '₹', code: 'INR', name: 'Indian Rupee' },
  { symbol: '$', code: 'USD', name: 'US Dollar' },
  { symbol: '€', code: 'EUR', name: 'Euro' },
  { symbol: '£', code: 'GBP', name: 'British Pound' },
  { symbol: '¥', code: 'JPY', name: 'Japanese Yen' },
  { symbol: 'A$', code: 'AUD', name: 'Australian Dollar' },
  { symbol: 'C$', code: 'CAD', name: 'Canadian Dollar' },
  { symbol: 'CHF', code: 'CHF', name: 'Swiss Franc' },
  { symbol: '¥', code: 'CNY', name: 'Chinese Yuan' },
  { symbol: 'HK$', code: 'HKD', name: 'Hong Kong Dollar' },
  { symbol: 'NZ$', code: 'NZD', name: 'New Zealand Dollar' },
  { symbol: 'S$', code: 'SGD', name: 'Singapore Dollar' },
  { symbol: 'kr', code: 'SEK', name: 'Swedish Krona' },
  { symbol: 'R', code: 'ZAR', name: 'South African Rand' },
  { symbol: 'R$', code: 'BRL', name: 'Brazilian Real' },
  { symbol: '₽', code: 'RUB', name: 'Russian Ruble' }
];

const categories = ['Food', 'Travel', 'Bills', 'Shopping', 'Entertainment', 'Other'];

// Hardcoded exchange rates for summary calculation
const EXCHANGE_RATES = {
  '₹': 1,
  '$': 83.1,
  '€': 88.5,
  '£': 102.5,
  '¥': 0.56,
  'A$': 53.6,
  'C$': 60.1,
  'CHF': 91.5,
  'HK$': 10.6,
  'NZ$': 49.3,
  'S$': 61.2,
  'kr': 7.6,
  'R': 4.4,
  'R$': 16.9,
  '₽': 0.9
};

const convertToINR = (amount, currency) => {
  const rate = EXCHANGE_RATES[currency] || 1;
  return amount * rate;
};

export default function ExpenseTrackerApp() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [note, setNote] = useState('');
  const [newCurrency, setNewCurrency] = useState('₹');
  const [newCategory, setNewCategory] = useState('Other');
  const [customNewCategory, setCustomNewCategory] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editAmount, setEditAmount] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editNote, setEditNote] = useState('');
  const [editCurrency, setEditCurrency] = useState('₹');
  const [editCategory, setEditCategory] = useState('Other');
  const [customEditCategory, setCustomEditCategory] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [summary, setSummary] = useState({
    total: 0,
    byCategory: {},
    byMonth: {}
  });
  const [showSummary, setShowSummary] = useState(false);
  const [summaryMonth, setSummaryMonth] = useState('');

  const loadExpenses = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (filterCategory) query.append('category', filterCategory);
      if (filterStartDate) query.append('startDate', filterStartDate);
      if (filterEndDate) query.append('endDate', filterEndDate);

      const res = await fetch(`${API_BASE}/expenses?${query.toString()}`);
      const data = await res.json();
      setExpenses(data);
    } catch (err) { setError('Failed to load'); }
    setLoading(false);
  };

  const calculateSummary = () => {
    let total = 0;
    const byCategory = {};
    const byMonth = {};

    const filteredExpenses = summaryMonth
      ? expenses.filter(exp => new Date(exp.date).toLocaleDateString('default', { month: 'long', year: 'numeric' }) === summaryMonth)
      : expenses;

    filteredExpenses.forEach(exp => {
      const amountInINR = convertToINR(exp.amount, exp.currency);
      total += amountInINR;

      const category = exp.category || 'Other';
      byCategory[category] = (byCategory[category] || 0) + amountInINR;

      const month = new Date(exp.date).toLocaleDateString('default', { month: 'long', year: 'numeric' });
      byMonth[month] = (byMonth[month] || 0) + amountInINR;
    });

    setSummary({
      total,
      byCategory,
      byMonth
    });
  };

  const getExpenseMonths = () => {
    const months = new Set();
    expenses.forEach(exp => {
      months.add(new Date(exp.date).toLocaleDateString('default', { month: 'long', year: 'numeric' }));
    });
    return [...months].sort((a, b) => new Date(a) - new Date(b));
  };

  useEffect(() => { loadExpenses(); }, [filterCategory, filterStartDate, filterEndDate]);
  useEffect(() => { calculateSummary(); }, [expenses, summaryMonth]);

  const handleAdd = async () => {
    const categoryToSave = newCategory === 'Other' ? customNewCategory : newCategory;
    if (!amount || !date || !categoryToSave) return alert('Fill in all required fields');

    await fetch(`${API_BASE}/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, date, note, currency: newCurrency, category: categoryToSave })
    });
    setAmount(''); setDate(''); setNote(''); setNewCategory('Other'); setCustomNewCategory('');
    loadExpenses();
  };

  const handleDelete = async (id) => {
    await fetch(`${API_BASE}/expenses/${id}`, { method: 'DELETE' });
    loadExpenses();
  };

  const handleUpdate = async () => {
    const categoryToSave = editCategory === 'Other' ? customEditCategory : editCategory;
    if (!editAmount || !editDate || !categoryToSave) return alert('Fill in all required fields');

    await fetch(`${API_BASE}/expenses/${editingId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: editAmount, date: editDate, note: editNote, currency: editCurrency, category: categoryToSave })
    });
    setEditingId(null); setEditAmount(''); setEditDate(''); setEditNote(''); setEditCurrency('₹'); setEditCategory('Other'); setCustomEditCategory('');
    loadExpenses();
  };

  const startEdit = (expense) => {
    setEditingId(expense._id);
    setEditAmount(expense.amount);
    setEditDate(new Date(expense.date).toISOString().split('T')[0]);
    setEditNote(expense.note);
    setEditCurrency(expense.currency);

    if (categories.includes(expense.category)) {
      setEditCategory(expense.category);
      setCustomEditCategory('');
    } else {
      setEditCategory('Other');
      setCustomEditCategory(expense.category);
    }
  };

  const cancelEdit = () => {
    setEditingId(null); setEditAmount(''); setEditDate(''); setEditNote(''); setEditCurrency('₹'); setEditCategory('Other'); setCustomEditCategory('');
  };

  return (
    <div className="container">
      <h1>Expense Tracker</h1>
      {error && <p>{error}</p>}

      {/* Add Expense Form */}
      <div className="expense-form">
        <input value={amount} onChange={e => setAmount(e.target.value)} placeholder="Amount" type="number" />
        <select value={newCurrency} onChange={e => setNewCurrency(e.target.value)} style={{ fontSize: '0.8em', padding: '0.75rem 0.5rem', width: 'auto' }}>
          {currencies.map(c => (<option key={c.code} value={c.symbol}>{c.symbol} ({c.code})</option>))}
        </select>
        <select value={newCategory} onChange={e => {
            setNewCategory(e.target.value);
            if (e.target.value !== 'Other') setCustomNewCategory('');
          }} style={{ fontSize: '0.8em', padding: '0.75rem 0.5rem', width: 'auto' }}>
          {categories.map(c => (<option key={c} value={c}>{c}</option>))}
        </select>
        {newCategory === 'Other' && (
          <input
            value={customNewCategory}
            onChange={e => setCustomNewCategory(e.target.value)}
            placeholder="Custom Category"
            style={{ flex: 1, padding: '0.75rem', border: '1px solid #ccc', borderRadius: '5px' }}
          />
        )}
        <input value={date} onChange={e => setDate(e.target.value)} type="date" />
        <input value={note} onChange={e => setNote(e.target.value)} placeholder="Note" />
        <button onClick={handleAdd}>Add</button>
      </div>

      {/* Filters */}
      <div style={{ marginBottom: '20px', textAlign: 'center', display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
          <option value="">All Categories</option>
          {categories.map(c => (<option key={c} value={c}>{c}</option>))}
        </select>
        <span>After</span>
        <input type="date" value={filterStartDate} onChange={e => setFilterStartDate(e.target.value)} />
        <span>Before</span>
        <input type="date" value={filterEndDate} onChange={e => setFilterEndDate(e.target.value)} />
      </div>

      {/* Summary Reports Button */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <button onClick={() => setShowSummary(!showSummary)}>
          {showSummary ? 'Hide Summary' : 'Show Summary'}
        </button>
      </div>

      {/* Summary Reports Section (Conditionally Rendered) */}
      {showSummary && (
        <div style={{ padding: '20px', border: '1px solid #eee', borderRadius: '8px', marginBottom: '20px', backgroundColor: '#f9f9f9' }}>
          <h2>Summary Reports</h2>
          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="summary-month-filter">Select Month:</label>
            <select
              id="summary-month-filter"
              value={summaryMonth}
              onChange={e => setSummaryMonth(e.target.value)}
              style={{ marginLeft: '10px' }}
            >
              <option value="">All Months</option>
              {getExpenseMonths().map(month => (
                <option key={month} value={month}>{month}</option>
              ))}
            </select>
          </div>
          <div>
            <strong>Total Spent:</strong> ₹{summary.total.toFixed(2)}
          </div>
          <div style={{ marginTop: '15px' }}>
            <strong>Total by Category:</strong>
            <ul style={{ listStyleType: 'none', padding: 0 }}>
              {Object.entries(summary.byCategory).map(([cat, total]) => (
                <li key={cat}>
                  {cat}: ₹{total.toFixed(2)}
                </li>
              ))}
            </ul>
          </div>
          <div style={{ marginTop: '15px' }}>
            <strong>Total by Month:</strong>
            <ul style={{ listStyleType: 'none', padding: 0 }}>
              {Object.entries(summary.byMonth).map(([month, total]) => (
                <li key={month}>
                  {month}: ₹{total.toFixed(2)}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {loading ? <p>Loading...</p> :
        <ul className="expense-list">
          {expenses.map(e => (
            <li key={e._id}>
              {editingId === e._id ? (
                <>
                  <div className="edit-form-group">
                    <input value={editAmount} onChange={ev => setEditAmount(ev.target.value)} placeholder="Amount" type="number" />
                    <select value={editCurrency} onChange={ev => setEditCurrency(ev.target.value)} style={{ fontSize: '0.8em', padding: '0.5rem', width: 'auto' }}>
                      {currencies.map(c => (<option key={c.code} value={c.symbol}>{c.symbol} ({c.code})</option>))}
                    </select>
                    <select value={editCategory} onChange={ev => {
                        setEditCategory(ev.target.value);
                        if (ev.target.value !== 'Other') setCustomEditCategory('');
                      }} style={{ fontSize: '0.8em', padding: '0.5rem', width: 'auto' }}>
                      {categories.map(c => (<option key={c} value={c}>{c}</option>))}
                    </select>
                    {editCategory === 'Other' && (
                      <input
                        value={customEditCategory}
                        onChange={ev => setCustomEditCategory(ev.target.value)}
                        placeholder="Custom Category"
                        style={{ flex: 1, padding: '0.75rem', border: '1px solid #ccc', borderRadius: '5px' }}
                      />
                    )}
                    <input value={editDate} onChange={ev => setEditDate(ev.target.value)} type="date" />
                    <input value={editNote} onChange={ev => setEditNote(ev.target.value)} placeholder="Note" />
                  </div>
                  <div className="expense-actions">
                    <button className="btn-save" onClick={handleUpdate}>Save</button>
                    <button className="btn-cancel" onClick={cancelEdit}>Cancel</button>
                  </div>
                </>
              ) : (
                <>
                  <div className="expense-details">
                    <span>{new Date(e.date).toLocaleDateString()}</span>
                    <span>-</span>
                    <span>{e.currency}{e.amount}</span>
                    <span>-</span>
                    <span>{e.category}</span>
                    <span>-</span>
                    <span>{e.note}</span>
                  </div>
                  <div className="expense-actions">
                    <button className="btn-edit" onClick={() => startEdit(e)}>Edit</button>
                    <button className="btn-delete" onClick={() => handleDelete(e._id)}>Delete</button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      }
    </div>
  );
}