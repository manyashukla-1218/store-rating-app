import { createContext, useContext, useState } from 'react';
import { Routes, Route, Navigate, NavLink, useNavigate } from 'react-router-dom';
import { Login, Signup } from './pages/Auth.jsx';
import Admin from './pages/Admin.jsx';
import UserStores from './pages/UserStores.jsx';
import Owner from './pages/Owner.jsx';
import Password from './pages/Password.jsx';
import { roleLabel } from './utils.js';

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);
const home = r => ({ admin: '/admin', user: '/stores', owner: '/owner' }[r] || '/login');

function Guard({ role, children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to={home(user.role)} replace />;
  return children;
}

function Shell({ children }) {
  const { user, logout } = useAuth();
  return (
    <div className="shell">
      <header className="nav">
        <div className="brand">★ RateMyStore</div>
        <nav>
          <NavLink to={home(user.role)} end>Dashboard</NavLink>
          <NavLink to="/password">Password</NavLink>
        </nav>
        <div className="me">
          <div><b>{user.name.split(' ')[0]}</b><small>{roleLabel(user.role)}</small></div>
          <button className="btn ghost" onClick={logout}>Logout</button>
        </div>
      </header>
      <main className="container">{children}</main>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || 'null'));
  const nav = useNavigate();
  const login = (token, u) => { localStorage.setItem('token', token); localStorage.setItem('user', JSON.stringify(u)); setUser(u); nav(home(u.role)); };
  const logout = () => { localStorage.clear(); setUser(null); nav('/login'); };
  return (
    <AuthCtx.Provider value={{ user, login, logout }}>
      <Routes>
        <Route path="/login" element={user ? <Navigate to={home(user.role)} /> : <Login />} />
        <Route path="/signup" element={user ? <Navigate to={home(user.role)} /> : <Signup />} />
        <Route path="/admin" element={<Guard role="admin"><Shell><Admin /></Shell></Guard>} />
        <Route path="/stores" element={<Guard role="user"><Shell><UserStores /></Shell></Guard>} />
        <Route path="/owner" element={<Guard role="owner"><Shell><Owner /></Shell></Guard>} />
        <Route path="/password" element={<Guard><Shell><Password /></Shell></Guard>} />
        <Route path="*" element={<Navigate to={user ? home(user.role) : '/login'} />} />
      </Routes>
    </AuthCtx.Provider>
  );
}
