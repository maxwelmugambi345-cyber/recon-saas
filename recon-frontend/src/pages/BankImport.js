import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function BankImport() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleUpload = async () => {
    if (!file) return setError('Please select a CSV file');
    setError('');
    setResult(null);
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const token = localStorage.getItem('token');
      const res = await axios.post('http://localhost:8000/bank-import/upload', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2>Bank Statement Import</h2>
        <button style={styles.backBtn} onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
      </div>
      <div style={styles.card}>
        <h3>Upload Bank Statement CSV</h3>
        <p style={styles.hint}>Supports CSV exports from Equity, KCB, Co-op, and most Kenyan banks. The system will auto-match transactions to customers and invoices.</p>
        <div style={styles.uploadArea}>
          <input type="file" accept=".csv" onChange={(e) => setFile(e.target.files[0])} style={styles.fileInput} />
          {file && <p style={styles.fileName}>Selected: {file.name}</p>}
        </div>
        {error && <p style={styles.error}>{error}</p>}
        <button style={loading ? styles.buttonDisabled : styles.button} onClick={handleUpload} disabled={loading}>
          {loading ? 'Processing...' : 'Upload and Reconcile'}
        </button>
      </div>
      {result && (
        <div>
          <div style={styles.summary}>
            <div style={{...styles.summaryCard, borderTop: '4px solid green'}}>
              <p style={styles.label}>Matched and Recorded</p>
              <p style={{...styles.value, color: 'green'}}>{result.summary.matched}</p>
            </div>
            <div style={{...styles.summaryCard, borderTop: '4px solid orange'}}>
              <p style={styles.label}>Unmatched</p>
              <p style={{...styles.value, color: 'orange'}}>{result.summary.unmatched}</p>
            </div>
            <div style={{...styles.summaryCard, borderTop: '4px solid #6b7280'}}>
              <p style={styles.label}>Duplicates Skipped</p>
              <p style={{...styles.value, color: '#6b7280'}}>{result.summary.duplicates}</p>
            </div>
            <div style={{...styles.summaryCard, borderTop: '4px solid red'}}>
              <p style={styles.label}>Errors</p>
              <p style={{...styles.value, color: 'red'}}>{result.summary.errors}</p>
            </div>
          </div>
          {result.details.matched.length > 0 && (
            <div style={styles.section}>
              <h3 style={{color: 'green'}}>Matched Transactions</h3>
              <table style={styles.table}>
                <thead><tr>
                  <th style={styles.th}>Reference</th>
                  <th style={styles.th}>Amount (KES)</th>
                  <th style={styles.th}>Customer</th>
                  <th style={styles.th}>Invoice ID</th>
                </tr></thead>
                <tbody>
                  {result.details.matched.map((m, i) => (
                    <tr key={i}>
                      <td style={styles.td}>{m.reference}</td>
                      <td style={styles.td}>{Number(m.amount).toLocaleString()}</td>
                      <td style={styles.td}>{m.customer}</td>
                      <td style={styles.td}>#{m.invoice_id}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {result.details.unmatched.length > 0 && (
            <div style={styles.section}>
              <h3 style={{color: 'orange'}}>Unmatched Transactions</h3>
              <table style={styles.table}>
                <thead><tr>
                  <th style={styles.th}>Reference</th>
                  <th style={styles.th}>Amount (KES)</th>
                  <th style={styles.th}>Description</th>
                  <th style={styles.th}>Reason</th>
                </tr></thead>
                <tbody>
                  {result.details.unmatched.map((m, i) => (
                    <tr key={i}>
                      <td style={styles.td}>{m.reference}</td>
                      <td style={styles.td}>{Number(m.amount).toLocaleString()}</td>
                      <td style={styles.td}>{m.description}</td>
                      <td style={styles.td}>{m.reason || 'No customer match'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { padding: '32px', fontFamily: 'sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  backBtn: { padding: '8px 16px', background: '#6b7280', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  card: { background: '#fff', padding: '24px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: '24px' },
  hint: { color: '#6b7280', fontSize: '14px', marginBottom: '20px' },
  uploadArea: { marginBottom: '16px' },
  fileInput: { padding: '10px', border: '2px dashed #ddd', borderRadius: '4px', width: '100%', cursor: 'pointer' },
  fileName: { color: '#4f46e5', fontSize: '14px', marginTop: '8px' },
  button: { padding: '12px 32px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '16px', cursor: 'pointer' },
  buttonDisabled: { padding: '12px 32px', background: '#a5b4fc', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '16px', cursor: 'not-allowed' },
  summary: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' },
  summaryCard: { background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
  label: { margin: '0 0 8px', color: '#888', fontSize: '13px' },
  value: { margin: 0, fontSize: '28px', fontWeight: 'bold' },
  section: { marginBottom: '24px' },
  table: { width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
  th: { padding: '12px 16px', background: '#f9fafb', textAlign: 'left', fontSize: '13px', color: '#6b7280', borderBottom: '1px solid #e5e7eb' },
  td: { padding: '12px 16px', borderBottom: '1px solid #e5e7eb', fontSize: '14px' },
  error: { color: 'red', marginBottom: '12px' }
};
