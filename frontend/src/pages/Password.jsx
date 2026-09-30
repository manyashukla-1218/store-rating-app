import { useState } from 'react';
import api, { errMsg } from '../api.js';
import { Field, Toast, useToast } from '../components.jsx';
import { passwordError } from '../utils.js';

export default function Password() {
  const [f, setF] = useState({ currentPassword: '', newPassword: '' });
  const [toast, show] = useToast();
  const submit = async e => {
    e.preventDefault();
    const p = passwordError(f.newPassword);
    if (p) return show(p, 'bad');
    try { await api.put('/auth/password', f); show('Password updated successfully'); setF({ currentPassword: '', newPassword: '' }); }
    catch (x) { show(errMsg(x), 'bad'); }
  };
  return (
    <div className="card narrow">
      <h2>🔒 Update Password</h2>
      <form onSubmit={submit}>
        <Field label="Current password"><input type="password" value={f.currentPassword} onChange={e => setF({ ...f, currentPassword: e.target.value })} /></Field>
        <Field label="New password (8-16, 1 uppercase, 1 special)"><input type="password" value={f.newPassword} onChange={e => setF({ ...f, newPassword: e.target.value })} /></Field>
        <button className="btn primary">Update</button>
      </form>
      <Toast toast={toast} />
    </div>
  );
}
