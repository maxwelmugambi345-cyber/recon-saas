import { useEffect, useState } from 'react';
import { getCustomers, createCustomer } from '../api/api';
import { useNavigate } from 'react-router-dom';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState({ name: '', phone: '', email: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    getCustomers().then((res) => setCustomers(res.data)).catch(() => setError('Failed to load customers'));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const res = await createCustomer(form);
      setCustomers([...customers, res.data]);
      setForm({ name: '', phone: '', email: '' });
      setSuccess('Customer created successfully');
    } catch (err) {
     const detail = err.response?.data?.detail;
     setError(typeof detail === 'string' ? detail : 'Failed to create customer'); 
      
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2>Customers</h2>
        <button style={styles.backBtn} onClick={() => navigate('/dashboard')}>← Dashboard</button>
      </div>

      <div style={styles.form}>
        <h3>Add Customer</h3>
        {error && <p style={styles.error}>{error}</p>}
        {success && <p style={styles.success}>{success}</p>}
        <form onSubmit={handleSubmit}>
          <div style={styles.row}>
            <input style={styles.input} placeholder="Name" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <input style={styles.input} placeholder="Phone" value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
            <input style={styles.input} placeholder="Email" type="email" value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            <button style={styles.button} type="submit">Add</button>
          </div>
        </form>
      </div>

      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>ID</th>
            <th style={styles.th}>Name</th>
            <th style={styles.th}>Phone</th>
            <th style={styles.th}>Email</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((c) => (
            <tr key={c.id}>
              <td style={styles.td}>{c.id}</td>
              <td style={styles.td}>{c.name}</td>
              <td style={styles.td}>{c.phone}</td>
              <td style={styles.td}>{c.email}</td>
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
  error: { color: 'red', marginBottom: '12px' },
  success: { color: 'green', marginBottom: '12px' }
};