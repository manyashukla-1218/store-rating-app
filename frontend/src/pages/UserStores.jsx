import { useEffect, useState } from 'react';
import api, { errMsg } from '../api.js';
import { Table, Stars, RatingBadge, Toast, useToast } from '../components.jsx';

export default function UserStores() {
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState({ name: '', address: '' });
  const [toast, show] = useToast();
  const load = () => api.get('/stores', { params: q }).then(r => setRows(r.data)).catch(e => show(errMsg(e), 'bad'));
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [q.name, q.address]);

  const rate = async (id, rating) => {
    try { await api.put(`/stores/${id}/rating`, { rating }); show('Rating saved ⭐'); load(); }
    catch (e) { show(errMsg(e), 'bad'); }
  };
  const cols = [
    { key: 'name', label: 'Store Name', render: r => <b>{r.name}</b> },
    { key: 'address', label: 'Address' },
    { key: 'overall', label: 'Overall Rating', render: r => <RatingBadge v={r.overall} /> },
    { key: 'my_rating', label: 'Your Rating', render: r => (r.my_rating ? <span className="badge green">{r.my_rating} / 5</span> : <span className="muted">Not rated</span>) },
    { key: 'act', label: 'Submit / Modify', noSort: true, render: r => <Stars value={r.my_rating} onChange={n => rate(r.id, n)} /> },
  ];
  return (
    <>
      <div className="hero-strip"><h1>Explore Stores</h1><p>Search by name or address and rate your experience (1 to 5).</p></div>
      <div className="card">
        <div className="filters">
          <input placeholder="🔍 Search by store name" value={q.name} onChange={e => setQ({ ...q, name: e.target.value })} />
          <input placeholder="📍 Search by address" value={q.address} onChange={e => setQ({ ...q, address: e.target.value })} />
        </div>
        <Table columns={cols} rows={rows} empty="No stores match your search" />
      </div>
      <Toast toast={toast} />
    </>
  );
}
