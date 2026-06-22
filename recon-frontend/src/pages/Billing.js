import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/api';

export default function Billing() {
  const [subscription, setSubscription] = useState(null);
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      const res = await API.get('/billing/subscription');
      setSubscription(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load subscription');
    }
  };

  const handlePay = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await API.post('/billing/pay', { phone });
      setSuccess('M-Pesa prompt sent to ' + phone + '. Complete payment on your phone.');
      fetchSubscription();
    } catch (err) {
      setError(err.response?.data?.detail || 'Payment failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const isOverdue = subscription && new Date(subscription.next_billing_date) < new Date();

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2>Billing & Subscription</h2>
        <button style={styles.backBtn} onClick={() => navigate('/dashboard')}>← Dashboard</button>
      </div>

      {error && <p style={styles.error}>{error}</p>}
      {success && <p style={styles.success}>{success}</p>}

      <div style={styles.planCard}>
        <div style={styles.planHeader}>
          <div>
            <h3 style={{ margin: 0 }}>Standard Plan</h3>
            <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: '14px' }}>
              Flat monthly fee per business
            </p>
          </div>
          <div style={styles.price}>
            KES 2,000<span style={styles.priceSub}>/month</span>
          </div>
        </div>

        <div style={styles.features}>
          {[
            'Unlimited invoices',
            'Payment reconciliation',
            'PDF invoice generation',
            'Dashboard & reports',
            'Team management',
            'M-Pesa integration',
          ].map((f) => (
            <div key={f} style={styles.feature}>
              <span style={styles.check}>✓</span> {f}
            </div>
          ))}
        </div>
      </div>

      {subscription && (
        <div style={styles.statusCard}>
          <h3 style={{ marginTop: 0 }}>Subscription Status</h3>
          <div style={styles.row}>
            <div style={styles.statBox}>
              <p style={styles.statLabel}>Status</p>
              <span style={{
                ...styles.badge,
                background: subscription.is_active ? '#16a34a' : '#ef4444'
              }}>
                {subscription.is_active ? 'ACTIVE' : 'INACTIVE'}
              </span>
            </div>
            <div style={styles.statBox}>
              <p style={styles.statLabel}>Next Billing Date</p>
              <p style={{ ...styles.statValue, color: isOverdue ? '#ef4444' : '#111827' }}>
                {new Date(subscription.next_billing_date).toLocaleDateString('en-KE', {
                  day: 'numeric', month: 'long', year: 'numeric'
                })}
                {isOverdue && ' (Overdue)'}
              </p>
            </div>
            <div style={styles.statBox}>
              <p style={styles.statLabel}>Last Payment</p>
              <p style={styles.statValue}>
                {subscription.last_payment_date
                  ? new Date(subscription.last_payment_date).toLocaleDateString('en-KE', {
                      day: 'numeric', month: 'long', year: 'numeric'
                    })
                  : 'No payments yet'}
              </p>
            </div>
            <div style={styles.statBox}>
              <p style={styles.statLabel}>Amount Due</p>
              <p style={styles.statValue}>KES 2,000</p>
            </div>
          </div>
        </div>
      )}

      <div style={styles.payCard}>
        <h3 style={{ marginTop: 0 }}>Pay via M-Pesa</h3>
        <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '16px' }}>
          Enter your M-Pesa number to receive a payment prompt.
        </p>
        <form onSubmit={handlePay}>
          <div style={styles.payRow}>
            <input
              style={styles.input}
              type="tel"
              placeholder="e.g. 0712345678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
            <button style={styles.button} type="submit" disabled={loading}>
              {loading ? 'Sending...' : 'Pay KES 2,000'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: { padding: '32px', fontFamily: 'sans-serif', maxWidth: '900px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  backBtn: { padding: '8px 16px', background: '#6b7280', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  planCard: { background: '#fff', padding: '24px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: '20px' },
  planHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' },
  price: { fontSize: '32px', fontWeight: 'bold', color: '#4f46e5' },
  priceSub: { fontSize: '16px', fontWeight: 'normal', color: '#6b7280' },
  features: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' },
  feature: { fontSize: '14px', color: '#374151' },
  check: { color: '#16a34a', fontWeight: 'bold', marginRight: '6px' },
  statusCard: { background: '#fff', padding: '24px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: '20px' },
  row: { display: 'flex', gap: '16px', flexWrap: 'wrap' },
  statBox: { flex: 1, minWidth: '160px', background: '#f9fafb', padding: '16px', borderRadius: '6px', border: '1px solid #e5e7eb' },
  statLabel: { fontSize: '12px', color: '#6b7280', margin: '0 0 6px' },
  statValue: { fontSize: '15px', fontWeight: '500', margin: 0 },
  badge: { padding: '3px 10px', borderRadius: '99px', color: '#fff', fontSize: '11px', fontWeight: 'bold' },
  payCard: { background: '#fff', padding: '24px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
  payRow: { display: 'flex', gap: '12px', flexWrap: 'wrap' },
  input: { padding: '10px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '14px', flex: 1 },
  button: { padding: '10px 24px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '500' },
  error: { color: 'red', marginBottom: '12px' },
  success: { color: 'green', marginBottom: '12px' },
};