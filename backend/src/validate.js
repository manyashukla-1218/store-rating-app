const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASS = /^(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,16}$/;
const s = v => (typeof v === 'string' ? v.trim() : '');
exports.userErrors = b => {
  const e = [];
  if (s(b.name).length < 20 || s(b.name).length > 60) e.push('Name must be 20-60 characters');
  if (!EMAIL.test(s(b.email))) e.push('Enter a valid email');
  if (s(b.address).length > 400) e.push('Address can be max 400 characters');
  if (!PASS.test(b.password || '')) e.push('Password: 8-16 chars, 1 uppercase & 1 special character');
  return e;
};
exports.storeErrors = b => {
  const e = [];
  if (s(b.name).length < 3 || s(b.name).length > 60) e.push('Store name must be 3-60 characters');
  if (!EMAIL.test(s(b.email))) e.push('Enter a valid email');
  if (!s(b.address) || s(b.address).length > 400) e.push('Address is required (max 400 characters)');
  return e;
};
exports.passwordOk = p => PASS.test(p || '');
