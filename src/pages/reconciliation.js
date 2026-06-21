import { useEffect, useState } from 'react';
import { getSummary, getCustomerReconciliation, getCustomers } from '../api/api';
import { useNavigate } from 'react-router-dom';

export default function Reconciliation() {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [reconciliation, setReconciliation] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    getCustomers().then((res) => setCustomers(res.data)).catch(() => setError('Failed to load customers'));
  }, []);

  const handleSearch = async () => {
    if (!selectedCustomer) return;
    setError('');
    setReconciliation(null);
    try {
      const res = await getCustomerReconciliation(selectedCustomer);
      setReconciliation(res.data);
    } catch (err) {
      setError('Failed to load reconciliation data');
    }
  };

  const statusColor = (status) => {
    if (status === 'paid') return 'green';
    if (status === 'overdue') return 'red';
    if (status === 'partial') return 'orange';
    return '#6b7280';
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2>Reconciliation</h2>
        <button style={styles.backBtn} onClick={() => navigate('/dashboard')}>← Dashboard</button>
      </div>

      <div style={styles.form}>
        <h3>Customer Reconciliation</h3>
        {error && <p style={styles.error}>{error}</p>}
        <div style={styles.row}>
          <select style={styles.input} value={selectedCustomer}
            onChange={(e) => setSelectedCustomer(e.target.value)}>
            <option value="">Select Customer</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <button style={styles.button} onClick={handleSearch}>Search</button>
        </div>
      </div>

      {reconciliation && (
        <div>
          <div style={styles.summary}>
            <div style={styles.summaryCard}>
              <p style={styles.label}>Customer</p>
              <p style={styles.value}>{reconciliation.customer_name}</p>
            </div>
            <div style={styles.summaryCard}>
              <p style={styles.label}>Total Invoiced</p>
              <p style={styles.value}>KES {Number(reconciliation.total_invoiced).toLocaleString()}</p>
            </div>
            <div style={styles.summaryCard}>
              <p style={styles.label}>Total Paid</p>
              <p style={styles.value}>KES {Number(reconciliation.total_paid).toLocaleString()}</p>
            </div>
            <div style={styles.summaryCard}>
              <p style={styles.label}>Outstanding Balance</p>
              <p style={{ ...styles.value, color: reconciliation.outstanding_balance > 0 ? 'red' : 'green' }}>
                KES {Number(reconciliation.outstanding_balance).toLocaleString()}
              </p>
            </div>
          </div>

          <h3>Invoice Breakdown</h3>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Invoice ID</th>
                <th style={styles.th}>Amount (KES)</th>
                <th style={styles.th}>Paid (KES)</th>
                <th style={styles.th}>Balance (KES)</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Due Date</th>
              </tr>
            </thead>
            <tbody>
              {reconciliation.invoices.map((inv) => (
                <tr key={inv.invoice_id}>
                  <td style={styles.td}>{inv.invoice_id}</td>
                  <td style={styles.td}>{Number(inv.amount).toLocaleString()}</td>
                  <td style={styles.td}>{Number(inv.total_paid).toLocaleString()}</td>
                  <td style={styles.td}>{Number(inv.balance).toLocaleString()}</td>
                  <td style={styles.td}>
                    <span style={{ color: statusColor(inv.status), fontWeight: 'bold' }}>
                      {inv.status.toUpperCase()}
                    </span>
                  </td>
                  <td style={styles.td}>{inv.due_date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { padding: '32px', fontFamily: 'sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  backBtn: { padding: '8px 16px', background: '#6b7280', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  form: { background: '#fff', padding: '24px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: '24px' },
  row: { display: 'flex', gap: '12px' },
  input: { padding: '10px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '14px', flex: 1 },
  button: { padding: '10px 24px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  summary: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' },
  summaryCard: { background: '#fff', padding: '24px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
  label: { margin: '0 0 8px', color: '#888', fontSize: '13px' },
  value: { margin: 0, fontSize: '20px', fontWeight: 'bold' },
  table: { width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
  th: { padding: '12px 16px', background: '#f9fafb', textAlign: 'left', fontSize: '13px', color: '#6b7280', borderBottom: '1px solid #e5e7eb' },
  td: { padding: '12px 16px', borderBottom: '1px solid #e5e7eb', fontSize: '14px' },
  error: { color: 'red', marginBottom: '12px' }
};