import { useEffect, useState } from 'react';
import api, { errMsg } from '../api.js';
import { Field, Table, RatingBadge, Toast, useToast } from '../components.jsx';
import { validateUser, validateStore, roleLabel } from '../utils.js';

function Overview({ go }) {
  const [s, setS] = useState(null);
  useEffect(() => { api.get('/admin/stats').then(r => setS(r.data)); }, []);
  const items = [
    ['Total Users', s?.users, 's1', '👥'], ['Total Stores', s?.stores, 's2', '🏬'], ['Total Ratings', s?.ratings, 's3', '⭐'],
  ];
  return (
    <>
      <div className="stats">
        {items.map(([l, v, c, i]) => <div key={l} className={`stat ${c}`}><span>{i} {l}</span><b>{v ?? '…'}</b></div>)}
      </div>
      <div className="card quick">
        <h3>Quick actions</h3>
        <button className="btn primary" onClick={() => go('users')}>+ Add / View Users</button>
        <button className="btn accent" onClick={() => go('stores')}>+ Add / View Stores</button>
      </div>
    </>
  );
}

function Users({ show }) {
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState({ name: '', email: '', address: '', role: '' });
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name: '', email: '', address: '', password: '', role: 'user' });
  const [errs, setErrs] = useState({});
  const [detail, setDetail] = useState(null);
  const load = () => api.get('/admin/users', { params: q }).then(r => setRows(r.data));
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [q.name, q.email, q.address, q.role]);

  const add = async e => {
    e.preventDefault();
    const v = validateUser(f); setErrs(v);
    if (Object.keys(v).length) return;
    try { await api.post('/admin/users', f); show('User created'); setF({ name: '', email: '', address: '', password: '', role: 'user' }); setOpen(false); load(); }
    catch (x) { show(errMsg(x), 'bad'); }
  };
  const set = k => e => setF({ ...f, [k]: e.target.value });
  const cols = [
    { key: 'name', label: 'Name' }, { key: 'email', label: 'Email' }, { key: 'address', label: 'Address' },
    { key: 'role', label: 'Role', render: r => <span className={`badge ${r.role}`}>{roleLabel(r.role)}</span> },
    { key: 'view', label: '', noSort: true, render: r => <button className="btn ghost sm" onClick={() => api.get(`/admin/users/${r.id}`).then(x => setDetail(x.data))}>Details</button> },
  ];
  return (
    <div className="card">
      <div className="row-between"><h3>Users</h3><button className="btn primary" onClick={() => setOpen(!open)}>{open ? 'Close' : '+ Add User'}</button></div>
      {open && (
        <form className="grid2 panel" onSubmit={add}>
          <Field label="Name (20-60)" error={errs.name}><input value={f.name} onChange={set('name')} /></Field>
          <Field label="Email" error={errs.email}><input value={f.email} onChange={set('email')} /></Field>
          <Field label="Password" error={errs.password}><input type="password" value={f.password} onChange={set('password')} /></Field>
          <Field label="Role"><select value={f.role} onChange={set('role')}><option value="user">Normal User</option><option value="owner">Store Owner</option><option value="admin">Admin</option></select></Field>
          <Field label="Address" error={errs.address}><textarea rows="2" value={f.address} onChange={set('address')} /></Field>
          <div className="end"><button className="btn accent">Create User</button></div>
        </form>
      )}
      <div className="filters">
        <input placeholder="Filter: name" value={q.name} onChange={e => setQ({ ...q, name: e.target.value })} />
        <input placeholder="Filter: email" value={q.email} onChange={e => setQ({ ...q, email: e.target.value })} />
        <input placeholder="Filter: address" value={q.address} onChange={e => setQ({ ...q, address: e.target.value })} />
        <select value={q.role} onChange={e => setQ({ ...q, role: e.target.value })}><option value="">All roles</option><option value="admin">Admin</option><option value="user">Normal User</option><option value="owner">Store Owner</option></select>
      </div>
      <Table columns={cols} rows={rows} />
      {detail && (
        <div className="modal" onClick={() => setDetail(null)}>
          <div className="card" onClick={e => e.stopPropagation()}>
            <h3>{detail.name}</h3>
            <p><b>Email:</b> {detail.email}</p><p><b>Address:</b> {detail.address || '—'}</p>
            <p><b>Role:</b> {roleLabel(detail.role)}</p>
            {detail.role === 'owner' && <p><b>Store Rating:</b> <RatingBadge v={detail.rating} /></p>}
            <button className="btn ghost" onClick={() => setDetail(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

function Stores({ show }) {
  const [rows, setRows] = useState([]);
  const [owners, setOwners] = useState([]);
  const [q, setQ] = useState({ name: '', email: '', address: '' });
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name: '', email: '', address: '', ownerId: '' });
  const [errs, setErrs] = useState({});
  const load = () => api.get('/admin/stores', { params: q }).then(r => setRows(r.data));
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [q.name, q.email, q.address]);
  useEffect(() => { api.get('/admin/users', { params: { role: 'owner' } }).then(r => setOwners(r.data)); }, [open]);

  const add = async e => {
    e.preventDefault();
    const v = validateStore(f); setErrs(v);
    if (Object.keys(v).length) return;
    try { await api.post('/admin/stores', f); show('Store created'); setF({ name: '', email: '', address: '', ownerId: '' }); setOpen(false); load(); }
    catch (x) { show(errMsg(x), 'bad'); }
  };
  const set = k => e => setF({ ...f, [k]: e.target.value });
  const cols = [
    { key: 'name', label: 'Name' }, { key: 'email', label: 'Email' }, { key: 'address', label: 'Address' },
    { key: 'rating', label: 'Rating', render: r => <RatingBadge v={r.rating} /> },
  ];
  return (
    <div className="card">
      <div className="row-between"><h3>Stores</h3><button className="btn accent" onClick={() => setOpen(!open)}>{open ? 'Close' : '+ Add Store'}</button></div>
      {open && (
        <form className="grid2 panel" onSubmit={add}>
          <Field label="Store name" error={errs.name}><input value={f.name} onChange={set('name')} /></Field>
          <Field label="Store email" error={errs.email}><input value={f.email} onChange={set('email')} /></Field>
          <Field label="Owner (optional)"><select value={f.ownerId} onChange={set('ownerId')}><option value="">— No owner —</option>{owners.map(o => <option key={o.id} value={o.id}>{o.name} ({o.email})</option>)}</select></Field>
          <Field label="Address" error={errs.address}><textarea rows="2" value={f.address} onChange={set('address')} /></Field>
          <div className="end"><button className="btn primary">Create Store</button></div>
        </form>
      )}
      <div className="filters">
        <input placeholder="Filter: name" value={q.name} onChange={e => setQ({ ...q, name: e.target.value })} />
        <input placeholder="Filter: email" value={q.email} onChange={e => setQ({ ...q, email: e.target.value })} />
        <input placeholder="Filter: address" value={q.address} onChange={e => setQ({ ...q, address: e.target.value })} />
      </div>
      <Table columns={cols} rows={rows} />
    </div>
  );
}

export default function Admin() {
  const [tab, setTab] = useState('overview');
  const [toast, show] = useToast();
  return (
    <>
      <div className="hero-strip"><h1>Admin Dashboard</h1><p>Manage users, stores and ratings in one place.</p></div>
      <div className="tabs">
        {['overview', 'users', 'stores'].map(t => <button key={t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>{t}</button>)}
      </div>
      {tab === 'overview' && <Overview go={setTab} />}
      {tab === 'users' && <Users show={show} />}
      {tab === 'stores' && <Stores show={show} />}
      <Toast toast={toast} />
    </>
  );
}
