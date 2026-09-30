const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASS = /^(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,16}$/;
export const passwordError = p => (PASS.test(p || '') ? '' : 'Password: 8-16 chars, 1 uppercase & 1 special character');
export function validateUser(f) {
  const e = {};
  const n = (f.name || '').trim().length;
  if (n < 20 || n > 60) e.name = 'Name must be 20-60 characters';
  if (!EMAIL.test((f.email || '').trim())) e.email = 'Enter a valid email';
  if ((f.address || '').length > 400) e.address = 'Max 400 characters';
  const p = passwordError(f.password);
  if (p) e.password = p;
  return e;
}
export function validateStore(f) {
  const e = {};
  const n = (f.name || '').trim().length;
  if (n < 3 || n > 60) e.name = 'Store name must be 3-60 characters';
  if (!EMAIL.test((f.email || '').trim())) e.email = 'Enter a valid email';
  if (!(f.address || '').trim() || f.address.length > 400) e.address = 'Address required (max 400 characters)';
  return e;
}
export const roleLabel = r => ({ admin: 'System Admin', user: 'Normal User', owner: 'Store Owner' }[r] || r);
