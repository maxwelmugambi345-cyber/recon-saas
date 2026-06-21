import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setError('Invalid reset link. Please request a new one.');
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${API_URL}/auth/reset-password`, { token, new_password: password });
      setMessage('Password reset successfully! Redirecting to login...');
      setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Reset failed. Link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Reset Password</h2>
        <p style={styles.subtitle}>Enter your new password below.</p>
        {error && <p style={styles.error}>{error}</p>}
        {message && <p style={styles.success}>{message}</p>}
        <form onSubmit={handleSubmit}>
          <div style={styles.field}>
            <label>New Password</label>
            <input style={styles.input} type="password" value={password}
              onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <div style={styles.field}>
            <label>Confirm Password</label>
            <input style={styles.input} type="password" value={confirm}
              onChange={(e) => setConfirm(e.target.value)} required />
          </div>
          <button style={loading ? styles.buttonDisabled : styles.button} type="submit" disabled={loading}>
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
        <p style={styles.back}><span style={styles.link} onClick={() => navigate('/')}>Back to Login</span></p>
      </div>
    </div>
  );
}

const styles = {
  container: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f0f2f5' },
  card: { background: '#fff', padding: '40px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', width: '360px' },
  title: { margin: '0 0 4px', fontSize: '22px' },
  subtitle: { margin: '0 0 24px', color: '#888', fontSize: '14px' },
  field: { marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '6px' },
  input: { padding: '10px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '14px' },
  button: { width: '100%', padding: '12px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '16px', cursor: 'pointer' },
  buttonDisabled: { width: '100%', padding: '12px', background: '#a5b4fc', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '16px', cursor: 'not-allowed' },
  error: { color: 'red', marginBottom: '12px' },
  success: { color: 'green', marginBottom: '12px' },
  back: { marginTop: '16px', textAlign: 'center', color: '#888', fontSize: '14px' },
  link: { color: '#4f46e5', cursor: 'pointer', fontWeight: 'bold' }
};
