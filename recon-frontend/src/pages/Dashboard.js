import { useEffect, useState } from 'react';
import { getSummary, getMonthlyRevenue } from '../api/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [monthlyRevenue, setMonthlyRevenue] = useState([]);
  const [error, setError] = useState('');
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    getSummary()
      .then((res) => setSummary(res.data))
      .catch(() => setError('Failed to load summary'));
    getMonthlyRevenue()
      .then((res) => {
        const data = Object.entries(res.data).map(([month, total]) => ({ month, total }));
        setMonthlyRevenue(data);
      })
      .catch(() => {});
  }, []);

  const pieData = summary ? [
    { name: 'Pending', value: summary.invoice_counts.pending, color: '#f59e0b' },
    { name: 'Paid', value: summary.invoice_counts.paid, color: '#10b981' },
    { name: 'Partial', value: summary.invoice_counts.partial, color: '#3b82f6' },
    { name: 'Overdue', value: summary.invoice_counts.overdue, color: '#ef4444' },
  ].filter(d => d.value > 0) : [];

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Dashboard</h2>
        <div style={styles.nav}>
          <button style={styles.navBtn} onClick={() => navigate('/customers')}>Customers</button>
          <button style={styles.navBtn} onClick={() => navigate('/invoices')}>Invoices</button>
          <button style={styles.navBtn} onClick={() => navigate('/payments')}>Payments</button>
          <button style={styles.navBtn} onClick={() => navigate('/reconciliation')}>Reconciliation</button>
          <button style={styles.navBtn} onClick={() => navigate('/bank-import')}>Bank Import</button>
          <button style={styles.logoutBtn} onClick={() => { logout(); navigate('/'); }}>Logout</button>
        </div>
      </div>

      {error && <p style={styles.error}>{error}</p>}

      {summary && (
        <>
          <div style={styles.cards}>
            <div style={styles.card}>
              <p style={styles.label}>Total Invoiced</p>
              <p style={styles.value}>KES {Number(summary.total_invoiced).toLocaleString()}</p>
            </div>
            <div style={styles.card}>
              <p style={styles.label}>Total Paid</p>
              <p style={{ ...styles.value, color: '#10b981' }}>KES {Number(summary.total_paid).toLocaleString()}</p>
            </div>
            <div style={styles.card}>
              <p style={styles.label}>Outstanding Balance</p>
              <p style={{ ...styles.value, color: '#ef4444' }}>KES {Number(summary.outstanding_balance).toLocaleString()}</p>
            </div>
            <div style={styles.card}>
              <p style={styles.label}>Overdue Invoices</p>
              <p style={{ ...styles.value, color: summary.invoice_counts.overdue > 0 ? '#ef4444' : '#10b981' }}>
                {summary.invoice_counts.overdue}
              </p>
            </div>
          </div>

          <div style={styles.charts}>
            <div style={styles.chartCard}>
              <h3 style={styles.chartTitle}>Monthly Revenue (KES)</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={monthlyRevenue}>
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value) => `KES ${Number(value).toLocaleString()}`} />
                  <Bar dataKey="total" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={styles.chartCard}>
              <h3 style={styles.chartTitle}>Invoice Status</h3>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
                      {pieData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Legend />
                    <Tooltip formatter={(value) => `${value} invoices`} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p style={styles.noData}>No invoice data yet</p>
              )}
            </div>
          </div>

          <div style={styles.statusCards}>
            <div style={{ ...styles.statusCard, borderTop: '3px solid #f59e0b' }}>
              <p style={styles.label}>Pending</p>
              <p style={styles.statusValue}>{summary.invoice_counts.pending}</p>
            </div>
            <div style={{ ...styles.statusCard, borderTop: '3px solid #3b82f6' }}>
              <p style={styles.label}>Partial</p>
              <p style={styles.statusValue}>{summary.invoice_counts.partial}</p>
            </div>
            <div style={{ ...styles.statusCard, borderTop: '3px solid #10b981' }}>
              <p style={styles.label}>Paid</p>
              <p style={styles.statusValue}>{summary.invoice_counts.paid}</p>
            </div>
            <div style={{ ...styles.statusCard, borderTop: '3px solid #ef4444' }}>
              <p style={styles.label}>Overdue</p>
              <p style={styles.statusValue}>{summary.invoice_counts.overdue}</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const styles = {
  container: { padding: '32px', fontFamily: 'sans-serif', background: '#f9fafb', minHeight: '100vh' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '12px' },
  title: { margin: 0, fontSize: '24px' },
  nav: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  navBtn: { padding: '8px 16px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  logoutBtn: { padding: '8px 16px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  cards: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' },
  card: { background: '#fff', padding: '24px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  label: { margin: '0 0 8px', color: '#6b7280', fontSize: '13px' },
  value: { margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#111' },
  charts: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px', marginBottom: '24px' },
  chartCard: { background: '#fff', padding: '24px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  chartTitle: { margin: '0 0 16px', fontSize: '15px', fontWeight: '600', color: '#374151' },
  statusCards: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px' },
  statusCard: { background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  statusValue: { margin: 0, fontSize: '28px', fontWeight: 'bold', color: '#111' },
  noData: { textAlign: 'center', color: '#9ca3af', padding: '60px 0' },
  error: { color: 'red' }
};