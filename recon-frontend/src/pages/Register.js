import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export default function Register() {
  const [form, setForm] = useState({ email: '', password: '', business_name: '', business_phone: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await axios.post(`${API_URL}/auth/register`, form);
      setSuccess('Account created! Redirecting to login...');
      setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Payment Reconciliation</h2>
        <p style={styles.subtitle}>Create your business account</p>
        {error && <p style={styles.error}>{error}</p>}
        {success && <p style={styles.success}>{success}</p>}
        <form onSubmit={handleSubmit}>
          <div style={styles.field}>
            <label>Business Name</label>
            <input style={styles.input} type="text" value={form.business_name}
              onChange={(e) => setForm({ ...form, business_name: e.target.value })} required />
          </div>
          <div style={styles.field}>
            <label>Business Phone (optional)</label>
            <input style={styles.input} type="text" value={form.business_phone}
              onChange={(e) => setForm({ ...form, business_phone: e.target.value })} />
          </div>
          <div style={styles.field}>
            <label>Email</label>
            <input style={styles.input} type="email" value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div style={styles.field}>
            <label>Password</label>
            <input style={styles.input} type="password" value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          </div>
          <button style={loading ? styles.buttonDisabled : styles.button} type="submit" disabled={loading}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
        <p style={styles.login}>Already have an account? <span style={styles.link} onClick={() => navigate('/')}>Sign in</span></p>
      </div>
    </div>
  );
}

const styles = {
  container: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f0f2f5' },
  card: { background: '#fff', padding: '40px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', width: '380px' },
  title: { margin: '0 0 4px', fontSize: '22px' },
  subtitle: { margin: '0 0 24px', color: '#888' },
  field: { marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '6px' },
  input: { padding: '10px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '14px' },
  button: { width: '100%', padding: '12px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '16px', cursor: 'pointer' },
  buttonDisabled: { width: '100%', padding: '12px', background: '#a5b4fc', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '16px', cursor: 'not-allowed' },
  error: { color: 'red', marginBottom: '12px' },
  success: { color: 'green', marginBottom: '12px' },
  login: { marginTop: '16px', textAlign: 'center', color: '#888', fontSize: '14px' },
  link: { color: '#4f46e5', cursor: 'pointer', fontWeight: 'bold' }
};
