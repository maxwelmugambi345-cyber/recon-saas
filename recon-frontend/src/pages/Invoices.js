import { useEffect, useState } from 'react';
import { getInvoices, createInvoice, getCustomers, downloadInvoicePdf } from '../api/api';
import { useNavigate } from 'react-router-dom';

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState({ customer_id: '', amount: '', due_date: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    getInvoices().then((res) => setInvoices(res.data)).catch(() => setError('Failed to load invoices'));
    getCustomers().then((res) => setCustomers(res.data)).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const res = await createInvoice({
        customer_id: parseInt(form.customer_id),
        amount: parseFloat(form.amount),
        due_date: form.due_date
      });
      setInvoices([...invoices, res.data]);
      setForm({ customer_id: '', amount: '', due_date: '' });
      setSuccess('Invoice created successfully');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create invoice');
    }
  };

  const handleDownloadPdf = async (invoiceId) => {
    try {
      const res = await downloadInvoicePdf(invoiceId);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice_${invoiceId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError('Failed to download PDF');
    }
  };

   
  const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('T')[0].split('-');
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-KE', { day: '2-digit', month: 'short', year: 'numeric' });
};
  
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('T')[0].split('-');
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-KE', { day: '2-digit', month: 'short', year: 'numeric' });
};

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2>Invoices</h2>
        <button style={styles.backBtn} onClick={() => navigate('/dashboard')}>← Dashboard</button>
      </div>

      <div style={styles.form}>
        <h3>Create Invoice</h3>
        {error && <p style={styles.error}>{error}</p>}
        {success && <p style={styles.success}>{success}</p>}
        <form onSubmit={handleSubmit}>
          <div style={styles.row}>
            <select style={styles.input} value={form.customer_id}
              onChange={(e) => setForm({ ...form, customer_id: e.target.value })} required>
              <option value="">Select Customer</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <input style={styles.input} placeholder="Amount (KES)" type="number" value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
            <input style={styles.input} type="date" value={form.due_date}
              onChange={(e) => setForm({ ...form, due_date: e.target.value })} required />
            <button style={styles.button} type="submit">Create</button>
          </div>
        </form>
      </div>

      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>ID</th>
            <th style={styles.th}>Customer</th>
            <th style={styles.th}>Amount (KES)</th>
            <th style={styles.th}>Status</th>
            <th style={styles.th}>Due Date</th>
            <th style={styles.th}>Created</th>
            <th style={styles.th}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((inv) => (
            <tr key={inv.id}>
              <td style={styles.td}>{inv.id}</td>
              <td style={styles.td}>{customers.find(c => c.id === inv.customer_id)?.name || inv.customer_id}</td>
              <td style={styles.td}>{Number(inv.amount).toLocaleString()}</td>
              <td style={styles.td}>
                <span style={{ color: statusColor(inv.status), fontWeight: 'bold' }}>
                  {inv.status.toUpperCase()}
                </span>
              </td>
              <td style={styles.td}>{formatDate(inv.due_date)}</td>
              <td style={styles.td}>{formatDate(inv.created_at)}</td>
              <td style={styles.td}>
                <button style={styles.pdfBtn} onClick={() => handleDownloadPdf(inv.id)}>
                  Download PDF
                </button>
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
  pdfBtn: { padding: '6px 12px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' },
  error: { color: 'red', marginBottom: '12px' },
  success: { color: 'green', marginBottom: '12px' }
};