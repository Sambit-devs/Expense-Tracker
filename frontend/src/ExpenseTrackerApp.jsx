import React, { useEffect, useState } from 'react';
import { useAuth, UserButton } from '@clerk/clerk-react';
import './App.css';

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

export default function ExpenseTrackerApp() {
  const { getToken } = useAuth();
  
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
  const [filterCurrency, setFilterCurrency] = useState('');
  const [summary, setSummary] = useState({
    total: 0,
    byCategory: {},
    byMonth: {}
  });
  const [showSummary, setShowSummary] = useState(false);
  const [summaryMonth, setSummaryMonth] = useState('');
  
  // New State for Pagination
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ totalPages: 1 });

  // New State for Exchange Rates
  const [exchangeRates, setExchangeRates] = useState({});

  // New useEffect to fetch exchange rates
  useEffect(() => {
    const fetchExchangeRates = async () => {
      try {
        const res = await fetch('https://api.exchangerate-api.com/v4/latest/INR');
        if (!res.ok) throw new Error('Failed to fetch exchange rates');
        const data = await res.json();
        const invertedRates = { INR: 1 };
        for (const code in data.rates) {
          invertedRates[code] = data.rates[code];
        }
        setExchangeRates(invertedRates);
      } catch (err) {
        console.error("Error fetching exchange rates:", err);
        // Fallback to hardcoded rates if API call fails
        setExchangeRates({
          '₹': 1, '$': 83.1, '€': 88.5, '£': 102.5, '¥': 0.56, 'A$': 53.6,
          'C$': 60.1, 'CHF': 91.5, 'HK$': 10.6, 'NZ$': 49.3, 'S$': 61.2,
          'kr': 7.6, 'R': 4.4, 'R$': 16.9, '₽': 0.9
        });
        setError('Could not fetch latest exchange rates. Using a fallback.');
      }
    };
    fetchExchangeRates();
  }, []);

  const convertToINR = (amount, currencySymbol) => {
    const currencyCode = currencies.find(c => c.symbol === currencySymbol)?.code;
    const rate = exchangeRates[currencyCode] || 1;
    return amount * rate;
  };

  const loadExpenses = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const query = new URLSearchParams();
      if (filterCategory) query.append('category', filterCategory);
      if (filterStartDate) query.append('startDate', filterStartDate);
      if (filterEndDate) query.append('endDate', filterEndDate);
      
      // Add pagination parameters
      query.append('page', page);
      query.append('limit', 15); // You can change this value

      const res = await fetch(`${API_BASE}/expenses?${query.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!res.ok) {
        console.error(`Failed to fetch expenses: HTTP Status ${res.status}`);
        setError(`Failed to load expenses. Server responded with status ${res.status}.`);
        return;
      }
      
      const { data, meta } = await res.json();
      const filteredByCurrency = filterCurrency ? data.filter(exp => exp.currency === filterCurrency) : data;
      setExpenses(filteredByCurrency);
      setMeta(meta);
      setError('');
    } catch (err) { 
      console.error('Network or parsing error during loadExpenses:', err);
      setError('Network error: Could not connect to backend.'); 
    }
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

  useEffect(() => {
    if (getToken) {
      loadExpenses();
    }
  }, [getToken, filterCategory, filterStartDate, filterEndDate, filterCurrency, page]);

  useEffect(() => { calculateSummary(); }, [expenses, summaryMonth]);

  const handleAdd = async () => {
    const categoryToSave = newCategory === 'Other' ? customNewCategory : newCategory;
    if (!amount || !date || !categoryToSave) return alert('Fill in all required fields');

    const token = await getToken();
    const res = await fetch(`${API_BASE}/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ amount, date, note, currency: newCurrency, category: categoryToSave })
    });
    
    if (!res.ok) {
        console.error(`Failed to add expense: HTTP Status ${res.status}`);
        setError('Failed to add expense. Check inputs/backend logs.');
        return;
    }

    setAmount(''); setDate(''); setNote(''); setNewCategory('Other'); setCustomNewCategory('');
    loadExpenses();
  };

  const handleDelete = async (id) => {
    const token = await getToken();
    await fetch(`${API_BASE}/expenses/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    loadExpenses();
  };

  const handleUpdate = async () => {
    const categoryToSave = editCategory === 'Other' ? customEditCategory : editCategory;
    if (!editAmount || !editDate || !categoryToSave) return alert('Fill in all required fields');

    const token = await getToken();
    await fetch(`${API_BASE}/expenses/${editingId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ amount: editAmount, date: editDate, note: editNote, currency: editCurrency, category: categoryToSave })
    });
    setEditingId(null); setEditAmount(''); setEditDate(''); setEditNote(''); setEditCurrency('₹'); setEditCategory('Other'); setCustomEditCategory('');
    loadExpenses();
  };

  const handleExport = () => {
    const csvContent = "data:text/csv;charset=utf-8," +
      "Date,Amount,Currency,Category,Note\n" +
      expenses.map(e => `${new Date(e.date).toLocaleDateString()},${e.amount},${e.currency},"${e.category}","${e.note}"`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "expenses.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
      <div className="header-actions">
        <UserButton />
      </div>
      <h1>Expense Tracker</h1>
      {error && <p className="error-message">{error}</p>}

      {/* Add Expense Form */}
      <div className="expense-form">
        <input value={amount} onChange={e => setAmount(e.target.value)} placeholder="Amount" type="number" />
        <select value={newCurrency} onChange={e => setNewCurrency(e.target.value)}>
          {currencies.map(c => (<option key={c.code} value={c.symbol}>{c.symbol} ({c.code})</option>))}
        </select>
        <select value={newCategory} onChange={e => {
            setNewCategory(e.target.value);
            if (e.target.value !== 'Other') setCustomNewCategory('');
          }}>
          {categories.map(c => (<option key={c} value={c}>{c}</option>))}
        </select>
        {newCategory === 'Other' && (
          <input
            value={customNewCategory}
            onChange={e => setCustomNewCategory(e.target.value)}
            placeholder="Custom Category"
          />
        )}
        <input value={date} onChange={e => setDate(e.target.value)} type="date" />
        <input value={note} onChange={e => setNote(e.target.value)} placeholder="Note" />
        <button onClick={handleAdd}>Add</button>
      </div>

      {/* Filters */}
      <div className="filters-container">
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
          <option value="">All Categories</option>
          {categories.map(c => (<option key={c} value={c}>{c}</option>))}
        </select>
        <span>After</span>
        <input type="date" value={filterStartDate} onChange={e => setFilterStartDate(e.target.value)} />
        <span>Before</span>
        <input type="date" value={filterEndDate} onChange={e => setFilterEndDate(e.target.value)} />
        <select value={filterCurrency} onChange={e => setFilterCurrency(e.target.value)}>
          <option value="">All Currencies</option>
          {currencies.map(c => (<option key={c.code} value={c.symbol}>{c.symbol} ({c.code})</option>))}
        </select>
        <button onClick={handleExport}>Export to CSV</button>
      </div>

      {/* Summary Reports Button */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <button onClick={() => setShowSummary(!showSummary)}>
          {showSummary ? 'Hide Summary' : 'Show Summary'}
        </button>
      </div>

      {/* Summary Reports Section (Conditionally Rendered) */}
      {showSummary && (
        <div className="summary-reports">
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
        <>
          <div className="expense-table">
            <div className="expense-header">
              <div>Date</div>
              <div>Amount</div>
              <div>Category</div>
              <div>Note</div>
              <div>Actions</div>
            </div>
            {expenses.map(e => (
              <div className="expense-row" key={e._id}>
                {editingId === e._id ? (
                  <div className="edit-panel">
                    <div className="edit-panel-inputs">
                      <input value={editAmount} onChange={ev => setEditAmount(ev.target.value)} placeholder="Amount" type="number" />
                      <select value={editCurrency} onChange={ev => setEditCurrency(ev.target.value)}>
                        {currencies.map(c => (<option key={c.code} value={c.symbol}>{c.symbol} ({c.code})</option>))}
                      </select>
                      <select value={editCategory} onChange={ev => {
                          setEditCategory(ev.target.value);
                          if (ev.target.value !== 'Other') setCustomEditCategory('');
                        }}>
                        {categories.map(c => (<option key={c} value={c}>{c}</option>))}
                      </select>
                      {editCategory === 'Other' && (
                        <input
                          value={customEditCategory}
                          onChange={ev => setCustomEditCategory(ev.target.value)}
                          placeholder="Custom Category"
                        />
                      )}
                      <input value={editDate} onChange={ev => setEditDate(ev.target.value)} type="date" />
                      <input value={editNote} onChange={ev => setEditNote(ev.target.value)} placeholder="Note" />
                    </div>
                    <div className="edit-panel-actions">
                      <button className="btn-save" onClick={handleUpdate}>Save</button>
                      <button className="btn-cancel" onClick={cancelEdit}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="expense-cell">{new Date(e.date).toLocaleDateString()}</div>
                    <div className="expense-cell">{e.currency}{e.amount}</div>
                    <div className="expense-cell">{e.category}</div>
                    <div className="expense-cell">{e.note}</div>
                    <div className="expense-cell">
                      <button className="btn-edit" onClick={() => startEdit(e)}>Edit</button>
                      <button className="btn-delete" onClick={() => handleDelete(e._id)}>Delete</button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
          {/* New Pagination Controls */}
          <div className="pagination-controls">
            <button
              onClick={() => setPage(prev => Math.max(prev - 1, 1))}
              disabled={page === 1}
            >
              Previous
            </button>
            <span>Page {page} of {meta.totalPages}</span>
            <button
              onClick={() => setPage(prev => Math.min(prev + 1, meta.totalPages))}
              disabled={page === meta.totalPages}
            >
              Next
            </button>
          </div>
        </>
      }
    </div>
  );
}