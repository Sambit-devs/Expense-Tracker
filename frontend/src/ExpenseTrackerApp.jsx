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

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h1>Expense Tracker</h1>
      {error && <p>{error}</p>}
      <input value={amount} onChange={e=>setAmount(e.target.value)} placeholder="Amount" />
      <input value={date} onChange={e=>setDate(e.target.value)} type="date" />
      <input value={note} onChange={e=>setNote(e.target.value)} placeholder="Note" />
      <button onClick={handleAdd}>Add</button>
      {loading ? <p>Loading...</p> :
      <ul>{expenses.map(e => <li key={e._id}>{new Date(e.date).toLocaleDateString()} - {e.amount} - {e.note}</li>)}</ul>}
    </div>
  );
}
