// frontend/src/ExpenseTrackerApp.jsx
import React, { useEffect, useState } from 'react';

const API_BASE = 'http://localhost:4000/api';

export default function ExpenseTrackerApp() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [note, setNote] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editAmount, setEditAmount] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editNote, setEditNote] = useState('');
  const [currency, setCurrency] = useState('₹'); // Default currency is now Indian Rupee

  const loadExpenses = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/expenses`);
      const data = await res.json();
      setExpenses(data);
    } catch (err) { setError('Failed to load'); }
    setLoading(false);
  };

  useEffect(() => { loadExpenses(); }, []);

  const handleAdd = async () => {
    if (!amount || !date) return alert('Fill in fields');
    await fetch(`${API_BASE}/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, date, note })
    });
    setAmount(''); setDate(''); setNote('');
    loadExpenses();
  };

  const handleDelete = async (id) => {
    await fetch(`${API_BASE}/expenses/${id}`, { method: 'DELETE' });
    loadExpenses();
  };

  const handleUpdate = async () => {
    if (!editAmount || !editDate) return alert('Fill in all fields');
    await fetch(`${API_BASE}/expenses/${editingId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: editAmount, date: editDate, note: editNote })
    });
    setEditingId(null);
    setEditAmount('');
    setEditDate('');
    setEditNote('');
    loadExpenses();
  };

  const startEdit = (expense) => {
    setEditingId(expense._id);
    setEditAmount(expense.amount);
    setEditDate(new Date(expense.date).toISOString().split('T')[0]);
    setEditNote(expense.note);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditAmount('');
    setEditDate('');
    setEditNote('');
  };

  return (
    <div className="container">
      <h1>Expense Tracker</h1>
      {error && <p>{error}</p>}
      <div className="expense-form">
        <input 
          value={amount} 
          onChange={e => setAmount(e.target.value)} 
          placeholder="Amount" 
          type="number" 
        />
        <input 
          value={date} 
          onChange={e => setDate(e.target.value)} 
          type="date" 
        />
        <input 
          value={note} 
          onChange={e => setNote(e.target.value)} 
          placeholder="Note" 
        />
        <button onClick={handleAdd}>Add</button>
      </div>

      <div style={{ marginBottom: '20px', textAlign: 'center', fontSize: '0.8em' }}> {/* Added inline style for smaller size */}
        <label htmlFor="currency-select">Select Currency: </label>
        <select id="currency-select" value={currency} onChange={e => setCurrency(e.target.value)}>
          <option value="₹">INR (₹)</option>
          <option value="$">USD ($)</option>
          <option value="€">EUR (€)</option>
          <option value="£">GBP (£)</option>
          <option value="¥">JPY (¥)</option>
        </select>
      </div>

      {loading ? <p>Loading...</p> :
        <ul className="expense-list">
          {expenses.map(e => (
            <li key={e._id}>
              {editingId === e._id ? (
                <>
                  <div className="edit-form-group">
                    <input value={editAmount} onChange={ev => setEditAmount(ev.target.value)} placeholder="Amount" type="number" />
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
                    <span>{currency}{e.amount}</span>
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