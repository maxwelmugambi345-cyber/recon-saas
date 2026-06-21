import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:8000',
});

// Attach JWT token to every request automatically
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const login = (email, password) => {
  const formData = new URLSearchParams();
  formData.append('username', email);
  formData.append('password', password);
  return API.post('/auth/login', formData, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
};

// Customers
export const getCustomers = () => API.get('/customers/');
export const createCustomer = (data) => API.post('/customers/', data);

// Invoices
export const getInvoices = () => API.get('/invoices/');
export const createInvoice = (data) => API.post('/invoices/', data);

// Payments
export const getPayments = () => API.get('/payments/');
export const createPayment = (data) => API.post('/payments/', data);

// Summary & Reconciliation
export const getSummary = () => API.get('/reconciliation/summary');
export const getCustomerReconciliation = (customerId) =>
  API.get(`/reconciliation/customer/${customerId}`);