import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/api';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ email: '', password: '', role: 'staff' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await API.get('/users/');
      setUsers(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load users');
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await API.post('/users/invite', form);
      setSuccess(`${form.email} added successfully`);
      setForm({ email: '', password: '', role: 'staff' });
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to add user');
    }
  };

  const handleRemove = async (userId) => {
    if (!window.confirm('Remove this user?')) return;
    setError('');
    try {
      await API.delete(`/users/${userId}`);
      setUsers(users.filter(u => u.id !== userId));
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to remove user');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2>User Management</h2>
        <button style={styles.backBtn} onClick={() => navigate('/dashboard')}>← Dashboard</button>
      </div>

      <div style={styles.form}>
        <h3>Add Staff Member</h3>
        {error && <p style={styles.error}>{error}</p>}
        {success && <p style={styles.success}>{success}</p>}
        <form onSubmit={handleInvite}>
          <div style={styles.row}>
            <input style={styles.input} placeholder="Email" type="email" value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            <input style={styles.input} placeholder="Password" type="password" value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            <select style={styles.input} value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="staff">Staff</option>
              <option value="owner">Owner</option>
            </select>
            <button style={styles.button} type="submit">Add User</button>
          </div>
        </form>
      </div>

      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>ID</th>
            <th style={styles.th}>Email</th>
            <th style={styles.th}>Role</th>
            <th style={styles.th}>Status</th>
            <th style={styles.th}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td style={styles.td}>{u.id}</td>
              <td style={styles.td}>{u.email}</td>
              <td style={styles.td}>
                <span style={{ ...styles.badge, background: u.role === 'owner' ? '#4f46e5' : '#6b7280' }}>
                  {u.role.toUpperCase()}
                </span>
              </td>
              <td style={styles.td}>
                <span style={{ color: u.is_active ? 'green' : 'red' }}>
                  {u.is_active ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td style={styles.td}>
                {u.role !== 'owner' && (
                  <button style={styles.removeBtn} onClick={() => handleRemove(u.id)}>
                    Remove
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const styles = {
  container: { padding: '32px', fontFamily: 'sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  backBtn: { padding: '8px 16px', background: '#6b7280', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  form: { background: '#fff', padding: '24px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: '24px' },
  row: { display: 'flex', gap: '12px', flexWrap: 'wrap' },
  input: { padding: '10px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '14px', flex: 1 },
  button: { padding: '10px 24px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  table: { width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
  th: { padding: '12px 16px', background: '#f9fafb', textAlign: 'left', fontSize: '13px', color: '#6b7280', borderBottom: '1px solid #e5e7eb' },
  td: { padding: '12px 16px', borderBottom: '1px solid #e5e7eb', fontSize: '14px' },
  badge: { padding: '3px 8px', borderRadius: '99px', color: '#fff', fontSize: '11px', fontWeight: 'bold' },
  removeBtn: { padding: '6px 12px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' },
  error: { color: 'red', marginBottom: '12px' },
  success: { color: 'green', marginBottom: '12px' }
};