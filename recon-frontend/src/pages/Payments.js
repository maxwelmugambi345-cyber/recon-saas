import { useEffect, useState } from 'react';
import { getPayments, createPayment, getCustomers, getInvoices } from '../api/api';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [form, setForm] = useState({ customer_id: '', invoice_id: '', amount: '', channel: '', reference: '', received_by: '' });
  const [stkForm, setStkForm] = useState({ customer_id: '', invoice_id: '', phone: '', amount: '' });
  const [stkFilteredInvoices, setStkFilteredInvoices] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [stkError, setStkError] = useState('');
  const [stkSuccess, setStkSuccess] = useState('');
  const [stkLoading, setStkLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    getPayments().then((res) => setPayments(res.data)).catch(() => setError('Failed to load payments'));
    getCustomers().then((res) => setCustomers(res.data)).catch(() => {});
    getInvoices().then((res) => setInvoices(res.data)).catch(() => {});
  }, []);

  const handleCustomerChange = (e) => {
    const customerId = e.target.value;
    setForm({ ...form, customer_id: customerId, invoice_id: '' });
    setFilteredInvoices(invoices.filter((inv) => inv.customer_id === parseInt(customerId) && inv.status !== 'paid'));
  };

  const handleStkCustomerChange = (e) => {
    const customerId = e.target.value;
    const customer = customers.find(c => c.id === parseInt(customerId));
    setStkForm({ ...stkForm, customer_id: customerId, invoice_id: '', phone: customer?.phone || '' });
    setStkFilteredInvoices(invoices.filter((inv) => inv.customer_id === parseInt(customerId) && inv.status !== 'paid'));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const res = await createPayment({
        customer_id: parseInt(form.customer_id),
        invoice_id: parseInt(form.invoice_id),
        amount: parseFloat(form.amount),
        channel: form.channel,
        reference: form.reference || null,
        received_by: form.received_by || null
      });
      setPayments([...payments, res.data]);
      setForm({ customer_id: '', invoice_id: '', amount: '', channel: '', reference: '', received_by: '' });
      setFilteredInvoices([]);
      setSuccess('Payment recorded successfully');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to record payment');
    }
  };

  const handleStkPush = async () => {
    setStkError('');
    setStkSuccess('');
    if (!stkForm.customer_id || !stkForm.invoice_id || !stkForm.phone || !stkForm.amount) {
      setStkError('Please fill all fields');
      return;
    }
    setStkLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('http://localhost:8000/mpesa/stk-push', {
        phone: stkForm.phone,
        amount: parseInt(stkForm.amount),
        invoice_id: parseInt(stkForm.invoice_id),
        customer_id: parseInt(stkForm.customer_id)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStkSuccess(`STK Push sent! Request ID: ${res.data.checkout_request_id}. Ask customer to check their phone.`);
    } catch (err) {
      setStkError(err.response?.data?.detail || 'STK Push failed');
    } finally {
      setStkLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2>Payments</h2>
        <button style={styles.backBtn} onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
      </div>

      <div style={styles.form}>
        <h3 style={{color: '#16a34a'}}>Send M-Pesa STK Push</h3>
        <p style={styles.hint}>Customer will receive a prompt on their phone to pay via M-Pesa.</p>
        {stkError && <p style={styles.error}>{stkError}</p>}
        {stkSuccess && <p style={styles.success}>{stkSuccess}</p>}
        <div style={styles.row}>
          <select style={styles.input} value={stkForm.customer_id} onChange={handleStkCustomerChange}>
            <option value="">Select Customer</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select style={styles.input} value={stkForm.invoice_id}
            onChange={(e) => setStkForm({ ...stkForm, invoice_id: e.target.value })}>
            <option value="">Select Invoice</option>
            {stkFilteredInvoices.map((inv) => (
              <option key={inv.id} value={inv.id}>Invoice #{inv.id} - KES {Number(inv.amount).toLocaleString()} ({inv.status})</option>
            ))}
          </select>
          <input style={styles.input} placeholder="Phone (e.g. 0712345678)" value={stkForm.phone}
            onChange={(e) => setStkForm({ ...stkForm, phone: e.target.value })} />
          <input style={styles.input} placeholder="Amount (KES)" type="number" value={stkForm.amount}
            onChange={(e) => setStkForm({ ...stkForm, amount: e.target.value })} />
        </div>
        <button
          style={stkLoading ? styles.stkBtnDisabled : styles.stkBtn}
          onClick={handleStkPush}
          disabled={stkLoading}
        >
          {stkLoading ? 'Sending...' : 'Send M-Pesa Prompt'}
        </button>
      </div>

      <div style={styles.form}>
        <h3>Record Manual Payment</h3>
        {error && <p style={styles.error}>{error}</p>}
        {success && <p style={styles.success}>{success}</p>}
        <form onSubmit={handleSubmit}>
          <div style={styles.row}>
            <select style={styles.input} value={form.customer_id} onChange={handleCustomerChange} required>
              <option value="">Select Customer</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <select style={styles.input} value={form.invoice_id}
              onChange={(e) => setForm({ ...form, invoice_id: e.target.value })} required>
              <option value="">Select Invoice</option>
              {filteredInvoices.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  Invoice #{inv.id} - KES {Number(inv.amount).toLocaleString()} ({inv.status})
                </option>
              ))}
            </select>
          </div>
          <div style={{ ...styles.row, marginTop: '12px' }}>
            <input style={styles.input} placeholder="Amount (KES)" type="number" value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
            <select style={styles.input} value={form.channel}
              onChange={(e) => setForm({ ...form, channel: e.target.value })} required>
              <option value="">Select Channel</option>
              <option value="mpesa">M-Pesa</option>
              <option value="cash">Cash</option>
              <option value="bank">Bank</option>
            </select>
            <input style={styles.input} placeholder="Reference (optional)" value={form.reference}
              onChange={(e) => setForm({ ...form, reference: e.target.value })} />
            <input style={styles.input} placeholder="Received By (optional)" value={form.received_by}
              onChange={(e) => setForm({ ...form, received_by: e.target.value })} />
          </div>
          <button style={{ ...styles.button, marginTop: '12px' }} type="submit">Record Payment</button>
        </form>
      </div>

      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>ID</th>
            <th style={styles.th}>Invoice ID</th>
            <th style={styles.th}>Customer ID</th>
            <th style={styles.th}>Amount (KES)</th>
            <th style={styles.th}>Channel</th>
            <th style={styles.th}>Reference</th>
            <th style={styles.th}>Received By</th>
            <th style={styles.th}>Date</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((p) => (
            <tr key={p.id}>
              <td style={styles.td}>{p.id}</td>
              <td style={styles.td}>{p.invoice_id}</td>
              <td style={styles.td}>{p.customer_id}</td>
              <td style={styles.td}>{Number(p.amount).toLocaleString()}</td>
              <td style={styles.td}>{p.channel.toUpperCase()}</td>
              <td style={styles.td}>{p.reference || '-'}</td>
              <td style={styles.td}>{p.received_by || '-'}</td>
              <td style={styles.td}>{new Date(p.payment_date).toLocaleDateString()}</td>
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
  hint: { color: '#6b7280', fontSize: '14px', marginBottom: '16px' },
  row: { display: 'flex', gap: '12px', flexWrap: 'wrap' },
  input: { padding: '10px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '14px', flex: 1 },
  button: { padding: '10px 24px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  stkBtn: { marginTop: '12px', padding: '10px 24px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' },
  stkBtnDisabled: { marginTop: '12px', padding: '10px 24px', background: '#86efac', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'not-allowed', fontSize: '14px' },
  table: { width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
  th: { padding: '12px 16px', background: '#f9fafb', textAlign: 'left', fontSize: '13px', color: '#6b7280', borderBottom: '1px solid #e5e7eb' },
  td: { padding: '12px 16px', borderBottom: '1px solid #e5e7eb', fontSize: '14px' },
  error: { color: 'red', marginBottom: '12px' },
  success: { color: 'green', marginBottom: '12px' }
};
