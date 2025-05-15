import axios from 'axios';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000',
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const login = (credentials) => api.post('/login', credentials).then((res) => res.data);
export const getCurrentUser = () => api.get('/me').then((res) => res.data);
export const createUser = (userData) => api.post('/admin/users', userData).then((res) => res.data);
export const getUsers = () => api.get('/admin/users').then((res) => res.data);
export const updateUser = (userId, userData) => api.put(`/admin/users/${userId}`, userData).then((res) => res.data);
export const deleteUser = (userId) => api.delete(`/admin/users/${userId}`).then((res) => res.data);
export const getUserActivity = () => api.get('/admin/user-activity').then((res) => res.data);
export const getVehicles = () => api.get('/vehicles').then((res) => res.data);
export const createVehicle = (vehicleData) => api.post('/vehicles', vehicleData).then((res) => res.data);
export const updateVehicle = (vehicleId, vehicleData) => api.put(`/vehicles/${vehicleId}`, vehicleData).then((res) => res.data);
export const deleteVehicle = (vehicleId) => api.delete(`/vehicles/${vehicleId}`).then((res) => res.data);
export const getDrivers = () => api.get('/drivers').then((res) => res.data);
export const createDriver = (driverData) => api.post('/drivers', driverData).then((res) => res.data);
export const updateDriver = (driverId, driverData) => api.put(`/drivers/${driverId}`, driverData).then((res) => res.data);
export const deleteDriver = (driverId) => api.delete(`/drivers/${driverId}`).then((res) => res.data);
export const getDriverDocuments = (driverId) => api.get(`/driver-documents/${driverId}`).then((res) => res.data);
export const uploadDriverDocument = (driverId, docData) => {
  const formData = new FormData();
  formData.append('file', docData.file);
  formData.append('doc_type', docData.doc_type);
  if (docData.doc_number) formData.append('doc_number', docData.doc_number);
  if (docData.issue_date) formData.append('issue_date', docData.issue_date);
  if (docData.expiry_date) formData.append('expiry_date', docData.expiry_date);
  if (docData.status) formData.append('status', docData.status);
  return api.post(`/driver-documents?driver_id=${driverId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((res) => res.data);
};
export const getVehicleDocuments = (vehicleId) => api.get(`/vehicle-documents/${vehicleId}`).then((res) => res.data);
export const uploadVehicleDocument = (vehicleId, docData) => {
  const formData = new FormData();
  formData.append('file', docData.file);
  formData.append('doc_type', docData.doc_type);
  if (docData.doc_number) formData.append('doc_number', docData.doc_number);
  if (docData.issue_date) formData.append('issue_date', docData.issue_date);
  if (docData.expiry_date) formData.append('expiry_date', docData.expiry_date);
  if (docData.status) formData.append('status', docData.status);
  return api.post(`/vehicle-documents?vehicle_id=${vehicleId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((res) => res.data);
};
export const getCosts = () => api.get('/costs').then((res) => res.data);
export const createCost = (costData) => {
  const formData = new FormData();
  Object.keys(costData).forEach((key) => {
    if (costData[key] !== null && costData[key] !== undefined) {
      formData.append(key, costData[key]);
    }
  });
  return api.post('/costs', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((res) => res.data);
};
export const getMaintenanceRecords = () => api.get('/maintenance-records').then((res) => res.data);
export const createMaintenanceRecord = (recordData) => api.post('/maintenance-records', recordData).then((res) => res.data);
export const optimizeRoute = (vehicleId) => api.post('/optimize-route', { vehicle_id: vehicleId }).then((res) => res.data);
export const getSimulatedUpdates = () => api.get('/simulated-updates').then((res) => res.data);
export const createBackup = () => api.post('/backup').then((res) => res.data);

export default api;