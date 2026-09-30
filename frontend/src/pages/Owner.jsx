import { useEffect, useState } from 'react';
import api from '../api.js';
import { Table, Stars } from '../components.jsx';

export default function Owner() {
  const [d, setD] = useState(null);
  useEffect(() => { api.get('/owner/dashboard').then(r => setD(r.data)); }, []);
  if (!d) return <p className="muted">Loading…</p>;
  if (!d.store) return <div className="card"><h2>No store assigned yet</h2><p className="muted">Ask the system administrator to link a store to your account.</p></div>;
  const cols = [
    { key: 'name', label: 'User' }, { key: 'email', label: 'Email' },
    { key: 'rating', label: 'Rating', render: r => <span className="badge gold">★ {r.rating}</span> },
    { key: 'updated_at', label: 'Date', render: r => new Date(r.updated_at).toLocaleDateString() },
  ];
  return (
    <>
      <div className="hero-strip"><h1>{d.store.name}</h1><p>📍 {d.store.address}</p></div>
      <div className="stats">
        <div className="stat s1"><span>Average Rating</span><b>{d.average ?? '—'}</b><Stars value={d.average} size={18} /></div>
        <div className="stat s2"><span>Total Ratings</span><b>{d.raters.length}</b></div>
      </div>
      <div className="card"><h3>Users who rated your store</h3><Table columns={cols} rows={d.raters} empty="No ratings yet" /></div>
    </>
  );
}
