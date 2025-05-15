import React, { useState, useEffect } from 'react';
import { Box, Typography, Tabs, Tab, TextField, Button, MenuItem, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { getCosts, createCost, getVehicles, getDrivers } from '../services/api';
import Plot from 'react-plotly.js';

function Costs() {
  const [tab, setTab] = useState(0);
  const [costs, setCosts] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    category: '',
    amount: '',
    description: '',
    vehicle_id: '',
    driver_id: '',
    status: '',
  });
  const [receipt, setReceipt] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchCosts();
    fetchVehicles();
    fetchDrivers();
  }, []);

  const fetchCosts = async () => {
    try {
      const data = await getCosts();
      setCosts(data);
    } catch (err) {
      setError('Failed to fetch costs');
    }
  };

  const fetchVehicles = async () => {
    try {
      const data = await getVehicles();
      setVehicles(data);
    } catch (err) {
      setError('Failed to fetch vehicles');
    }
  };

  const fetchDrivers = async () => {
    try {
      const data = await getDrivers();
      setDrivers(data);
    } catch (err) {
      setError('Failed to fetch drivers');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createCost(form, receipt);
      setForm({
        date: new Date().toISOString().split('T')[0],
        category: '',
        amount: '',
        description: '',
        vehicle_id: '',
        driver_id: '',
        status: '',
      });
      setReceipt(null);
      fetchCosts();
    } catch (err) {
      setError('Failed to add cost');
    }
  };

  const getCategoryData = () => {
    const categories = {};
    costs.forEach(c => {
      categories[c.category] = (categories[c.category] || 0) + c.amount;
    });
    return {
      labels: Object.keys(categories),
      datasets: [{ data: Object.values(categories), label: 'Costs by Category' }],
    };
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>Cost Management</Typography>
      {error && <Typography color="error">{error}</Typography>}
      <Tabs value={tab} onChange={(e, v) => setTab(v)}>
        <Tab label="Cost Overview" />
        <Tab label="Add New Cost" />
        <Tab label="Cost Analysis" />
      </Tabs>
      {tab === 0 && (
        <Box>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Vehicle</TableCell>
                <TableCell>Driver</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {costs.map(c => (
                <TableRow key={c.cost_id}>
                  <TableCell>{c.date}</TableCell>
                  <TableCell>{c.category}</TableCell>
                  <TableCell>{c.amount}</TableCell>
                  <TableCell>{vehicles.find(v => v.id === c.vehicle_id)?.registration_number || 'N/A'}</TableCell>
                  <TableCell>{drivers.find(d => d.id === c.driver_id)?.name || 'N/A'}</TableCell>
                  <TableCell>{c.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      )}
      {tab === 1 && (
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
          <TextField
            label="Date"
            type="date"
            value={form.date}
            onChange={e => setForm({ ...form, date: e.target.value })}
            fullWidth
            margin="normal"
          />
          <TextField
            select
            label="Category"
            value={form.category}
            onChange={e => setForm({ ...form, category: e.target.value })}
            fullWidth
            margin="normal"
          >
            {['Fuel', 'Maintenance', 'Servicing', 'Insurance', 'Repairs', 'Tolls', 'Parking', 'Other'].map(c => (
              <MenuItem key={c} value={c}>{c}</MenuItem>
            ))}
          </TextField>
          <TextField
            label="Amount"
            type="number"
            value={form.amount}
            onChange={e => setForm({ ...form, amount: e.target.value })}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Description"
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            fullWidth
            margin="normal"
          />
          <TextField
            select
            label="Vehicle"
            value={form.vehicle_id}
            onChange={e => setForm({ ...form, vehicle_id: e.target.value })}
            fullWidth
            margin="normal"
          >
            <MenuItem value="">Not Applicable</MenuItem>
            {vehicles.map(v => (
              <MenuItem key={v.id} value={v.id}>{v.registration_number}</MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Driver"
            value={form.driver_id}
            onChange={e => setForm({ ...form, driver_id: e.target.value })}
            fullWidth
            margin="normal"
          >
            <MenuItem value="">Not Applicable</MenuItem>
            {drivers.map(d => (
              <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Status"
            value={form.status}
            onChange={e => setForm({ ...form, status: e.target.value })}
            fullWidth
            margin="normal"
          >
            {['Pending', 'Approved', 'Rejected'].map(s => (
              <MenuItem key={s} value={s}>{s}</MenuItem>
            ))}
          </TextField>
          <input
            type="file"
            accept=".png,.jpg,.pdf"
            onChange={e => setReceipt(e.target.files[0])}
          />
          <Button type="submit" variant="contained" sx={{ mt: 2 }}>Add Cost</Button>
        </Box>
      )}
      {tab === 2 && (
        <Box>
          <Plot
            data={[{
              type: 'pie',
              labels: getCategoryData().labels,
              values: getCategoryData().datasets[0].data,
            }]}
            layout={{ title: 'Cost Distribution by Category' }}
          />
        </Box>
      )}
    </Box>
  );
}

export default Costs;