import axios from 'axios';
const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
});
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
export const login = (email, password) => {
  const formData = new URLSearchParams();
  formData.append('username', email);
  formData.append('password', password);
  return API.post('/auth/login', formData, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
};
export const getCustomers = () => API.get('/customers/');
export const createCustomer = (data) => API.post('/customers/', data);
export const getInvoices = () => API.get('/invoices/');
export const createInvoice = (data) => API.post('/invoices/', data);
export const getPayments = () => API.get('/payments/');
export const createPayment = (data) => API.post('/payments/', data);
export const getSummary = () => API.get('/reconciliation/summary');
export const getMonthlyRevenue = () => API.get('/reconciliation/monthly-revenue');
export const getCustomerReconciliation = (customerId) =>
  API.get(`/reconciliation/customer/${customerId}`);
export const downloadInvoicePdf = (invoiceId) =>
  API.get(`/invoices/${invoiceId}/pdf`, { responseType: 'blob' });
export default API;