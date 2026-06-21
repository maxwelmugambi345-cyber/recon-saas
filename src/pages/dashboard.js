import { useEffect, useState } from 'react';
import { getSummary } from '../api/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    getSummary()
      .then((res) => setSummary(res.data))
      .catch(() => setError('Failed to load summary'));
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2>Dashboard</h2>
        <div style={styles.nav}>
          <button style={styles.navBtn} onClick={() => navigate('/customers')}>Customers</button>
          <button style={styles.navBtn} onClick={() => navigate('/invoices')}>Invoices</button>
          <button style={styles.navBtn} onClick={() => navigate('/payments')}>Payments</button>
          <button style={styles.navBtn} onClick={() => navigate('/reconciliation')}>Reconciliation</button>
          <button style={styles.logoutBtn} onClick={() => { logout(); navigate('/'); }}>Logout</button>
        </div>
      </div>

      {error && <p style={styles.error}>{error}</p>}

      {summary && (
        <div style={styles.cards}>
          <div style={styles.card}>
            <p style={styles.label}>Total Invoiced</p>
            <p style={styles.value}>KES {Number(summary.total_invoiced).toLocaleString()}</p>
          </div>
          <div style={styles.card}>
            <p style={styles.label}>Total Paid</p>
            <p style={styles.value}>KES {Number(summary.total_paid).toLocaleString()}</p>
          </div>
          <div style={styles.card}>
            <p style={styles.label}>Outstanding Balance</p>
            <p style={styles.value}>KES {Number(summary.outstanding_balance).toLocaleString()}</p>
          </div>
          <div style={styles.card}>
            <p style={styles.label}>Pending Invoices</p>
            <p style={styles.value}>{summary.invoice_counts.pending}</p>
          </div>
          <div style={styles.card}>
            <p style={styles.label}>Partial Invoices</p>
            <p style={styles.value}>{summary.invoice_counts.partial}</p>
          </div>
          <div style={styles.card}>
            <p style={styles.label}>Paid Invoices</p>
            <p style={styles.value}>{summary.invoice_counts.paid}</p>
          </div>
          <div style={styles.card}>
            <p style={styles.label}>Overdue Invoices</p>
            <p style={{ ...styles.value, color: summary.invoice_counts.overdue > 0 ? 'red' : 'inherit' }}>
              {summary.invoice_counts.overdue}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { padding: '32px', fontFamily: 'sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' },
  nav: { display: 'flex', gap: '8px' },
  navBtn: { padding: '8px 16px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  logoutBtn: { padding: '8px 16px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  cards: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' },
  card: { background: '#fff', padding: '24px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
  label: { margin: '0 0 8px', color: '#888', fontSize: '13px' },
  value: { margin: 0, fontSize: '24px', fontWeight: 'bold' },
  error: { color: 'red' }
};