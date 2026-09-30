import { useState } from 'react';

export function Field({ label, error, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {error && <small className="err">{error}</small>}
    </label>
  );
}

export function Table({ columns, rows, empty = 'No records found' }) {
  const [sort, setSort] = useState({ key: null, dir: 1 });
  const data = [...rows];
  if (sort.key) {
    data.sort((a, b) => {
      const x = a[sort.key] ?? '', y = b[sort.key] ?? '';
      const r = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), undefined, { numeric: true });
      return r * sort.dir;
    });
  }
  const toggle = k => setSort(s => (s.key === k ? { key: k, dir: -s.dir } : { key: k, dir: 1 }));
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map(c => (
              <th key={c.key} onClick={() => !c.noSort && toggle(c.key)} className={c.noSort ? '' : 'sortable'}>
                {c.label} {sort.key === c.key ? (sort.dir === 1 ? '▲' : '▼') : ''}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 && <tr><td colSpan={columns.length} className="empty">{empty}</td></tr>}
          {data.map((r, i) => (
            <tr key={r.id ?? i}>{columns.map(c => <td key={c.key}>{c.render ? c.render(r) : r[c.key] ?? '—'}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Stars({ value = 0, onChange, size = 22 }) {
  const [hover, setHover] = useState(0);
  const shown = hover || Math.round(value || 0);
  return (
    <span className="stars" style={{ fontSize: size }}>
      {[1, 2, 3, 4, 5].map(n => (
        <span key={n} className={n <= shown ? 'on' : ''} style={{ cursor: onChange ? 'pointer' : 'default' }}
          onMouseEnter={() => onChange && setHover(n)} onMouseLeave={() => setHover(0)} onClick={() => onChange && onChange(n)}>★</span>
      ))}
    </span>
  );
}

export const RatingBadge = ({ v }) => (v == null ? <span className="muted">No ratings</span> : <span className="badge gold">★ {v.toFixed(1)}</span>);

export function Toast({ toast }) {
  return toast ? <div className={`toast ${toast.type}`}>{toast.text}</div> : null;
}
export function useToast() {
  const [toast, set] = useState(null);
  const show = (text, type = 'ok') => { set({ text, type }); setTimeout(() => set(null), 3000); };
  return [toast, show];
}
