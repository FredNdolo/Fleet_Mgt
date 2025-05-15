import React, { useState, useEffect } from 'react';
import { Box, Typography, Tabs, Tab, TextField, Button, MenuItem, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import { getMaintenanceRecords, createMaintenanceRecord, getVehicles } from '../services/api';

function Maintenance() {
  const [tab, setTab] = useState(0);
  const [records, setRecords] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [form, setForm] = useState({
    vehicle_id: '',
    maintenance_type: '',
    date: new Date().toISOString().split('T')[0],
    cost: '',
    notes: '',
    next_maintenance_date: '',
    status: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRecords();
    fetchVehicles();
  }, []);

  const fetchRecords = async () => {
    try {
      const data = await getMaintenanceRecords();
      setRecords(data);
    } catch (err) {
      setError('Failed to fetch maintenance records');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createMaintenanceRecord(form);
      setForm({
        vehicle_id: '',
        maintenance_type: '',
        date: new Date().toISOString().split('T')[0],
        cost: '',
        notes: '',
        next_maintenance_date: '',
        status: '',
      });
      fetchRecords();
    } catch (err) {
      setError('Failed to schedule maintenance');
    }
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>Maintenance Management</Typography>
      {error && <Typography color="error">{error}</Typography>}
      <Tabs value={tab} onChange={(e, v) => setTab(v)}>
        <Tab label="Maintenance Records" />
        <Tab label="Schedule Maintenance" />
      </Tabs>
      {tab === 0 && (
        <Box>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Vehicle</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Cost</TableCell>
                <TableCell>Next Maintenance</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {records.map(r => (
                <TableRow key={r.record_id}>
                  <TableCell>{vehicles.find(v => v.id === r.vehicle_id)?.registration_number}</TableCell>
                  <TableCell>{r.maintenance_type}</TableCell>
                  <TableCell>{r.date}</TableCell>
                  <TableCell>{r.cost}</TableCell>
                  <TableCell>{r.next_maintenance_date}</TableCell>
                  <TableCell>{r.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      )}
      {tab === 1 && (
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
          <TextField
            select
            label="Vehicle"
            value={form.vehicle_id}
            onChange={e => setForm({ ...form, vehicle_id: e.target.value })}
            fullWidth
            margin="normal"
          >
            {vehicles.map(v => (
              <MenuItem key={v.id} value={v.id}>{v.registration_number}</MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Maintenance Type"
            value={form.maintenance_type}
            onChange={e => setForm({ ...form, maintenance_type: e.target.value })}
            fullWidth
            margin="normal"
          >
            {['Regular Service', 'Oil Change', 'Tire Replacement', 'Brake Service', 'Major Repair', 'Inspection', 'Other'].map(t => (
              <MenuItem key={t} value={t}>{t}</MenuItem>
            ))}
          </TextField>
          <TextField
            label="Date"
            type="date"
            value={form.date}
            onChange={e => setForm({ ...form, date: e.target.value })}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Cost"
            type="number"
            value={form.cost}
            onChange={e => setForm({ ...form, cost: e.target.value })}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Notes"
            multiline
            value={form.notes}
            onChange={e => setForm({ ...form, notes: e.target.value })}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Next Maintenance Date"
            type="date"
            value={form.next_maintenance_date}
            onChange={e => setForm({ ...form, next_maintenance_date: e.target.value })}
            fullWidth
            margin="normal"
          />
          <TextField
            select
            label="Status"
            value={form.status}
            onChange={e => setForm({ ...form, status: e.target.value })}
            fullWidth
            margin="normal"
          >
            {['Scheduled', 'In Progress', 'Completed', 'Cancelled'].map(s => (
              <MenuItem key={s} value={s}>{s}</MenuItem>
            ))}
          </TextField>
          <Button type="submit" variant="contained" sx={{ mt: 2 }}>Schedule Maintenance</Button>
        </Box>
      )}
    </Box>
  );
}

export default Maintenance;