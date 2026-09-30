import { useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errMsg } from '../api.js';
import { useAuth } from '../App.jsx';
import { Field } from '../components.jsx';
import { validateUser } from '../utils.js';

function Wrap({ title, sub, children, foot }) {
  return (
    <div className="auth-page">
      <div className="auth-hero">
        <h1>★ RateMyStore</h1>
        <p>Discover great stores. Share honest ratings. Help businesses grow.</p>
        <div className="orb o1" /><div className="orb o2" /><div className="orb o3" />
      </div>
      <div className="card auth-card">
        <h2>{title}</h2><p className="muted">{sub}</p>
        {children}
        <p className="foot">{foot}</p>
      </div>
    </div>
  );
}

export function Login() {
  const { login } = useAuth();
  const [f, setF] = useState({ email: '', password: '' });
  const [err, setErr] = useState('');
  const submit = async e => {
    e.preventDefault(); setErr('');
    try { const { data } = await api.post('/auth/login', f); login(data.token, data.user); }
    catch (x) { setErr(errMsg(x)); }
  };
  return (
    <Wrap title="Welcome back 👋" sub="Login to continue" foot={<>New here? <Link to="/signup">Create account</Link></>}>
      <form onSubmit={submit}>
        <Field label="Email"><input type="email" value={f.email} onChange={e => setF({ ...f, email: e.target.value })} required /></Field>
        <Field label="Password"><input type="password" value={f.password} onChange={e => setF({ ...f, password: e.target.value })} required /></Field>
        {err && <div className="alert">{err}</div>}
        <button className="btn primary block">Login</button>
      </form>
    </Wrap>
  );
}

export function Signup() {
  const { login } = useAuth();
  const [f, setF] = useState({ name: '', email: '', address: '', password: '' });
  const [errs, setErrs] = useState({});
  const [err, setErr] = useState('');
  const set = k => e => setF({ ...f, [k]: e.target.value });
  const submit = async e => {
    e.preventDefault(); setErr('');
    const v = validateUser(f); setErrs(v);
    if (Object.keys(v).length) return;
    try { const { data } = await api.post('/auth/signup', f); login(data.token, data.user); }
    catch (x) { setErr(errMsg(x)); }
  };
  return (
    <Wrap title="Create your account ✨" sub="Sign up as a normal user" foot={<>Already registered? <Link to="/login">Login</Link></>}>
      <form onSubmit={submit}>
        <Field label="Full Name (20-60 chars)" error={errs.name}><input value={f.name} onChange={set('name')} /></Field>
        <Field label="Email" error={errs.email}><input value={f.email} onChange={set('email')} /></Field>
        <Field label="Address (max 400)" error={errs.address}><textarea rows="2" value={f.address} onChange={set('address')} /></Field>
        <Field label="Password" error={errs.password}><input type="password" value={f.password} onChange={set('password')} /></Field>
        {err && <div className="alert">{err}</div>}
        <button className="btn primary block">Sign up</button>
      </form>
    </Wrap>
  );
}
