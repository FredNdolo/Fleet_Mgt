import React, { useState, useEffect } from 'react';
import { Typography, Box, TextField, Button, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import { getDrivers, createDriver, updateDriver, deleteDriver } from '../services/api';

function DriverList() {
  const [drivers, setDrivers] = useState([]);
  const [form, setForm] = useState({
    name: '',
    license_number: '',
    total_trips: 0,
    rating: 0.0,
    status: 'Available',
  });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        const data = await getDrivers();
        setDrivers(data);
      } catch (err) {
        setError('Failed to fetch drivers');
      }
    };
    fetchDrivers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const driverData = {
        ...form,
        total_trips: parseInt(form.total_trips),
        rating: parseFloat(form.rating),
      };
      if (editingId) {
        const updatedDriver = await updateDriver(editingId, driverData);
        setDrivers(drivers.map((d) => (d.id === editingId ? updatedDriver : d)));
        setEditingId(null);
      } else {
        const newDriver = await createDriver(driverData);
        setDrivers([...drivers, newDriver]);
      }
      setForm({ name: '', license_number: '', total_trips: 0, rating: 0.0, status: 'Available' });
      setError('');
    } catch (err) {
      setError(editingId ? 'Failed to update driver' : 'Failed to add driver');
    }
  };

  const handleEdit = (driver) => {
    setForm({
      name: driver.name,
      license_number: driver.license_number,
      total_trips: driver.total_trips,
      rating: driver.rating,
      status: driver.status,
    });
    setEditingId(driver.id);
  };

  const handleDelete = async (driverId) => {
    try {
      await deleteDriver(driverId);
      setDrivers(drivers.filter((d) => d.id !== driverId));
      setError('');
    } catch (err) {
      setError('Failed to delete driver');
    }
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>Driver Management</Typography>
      {error && <Typography color="error">{error}</Typography>}
      <Box component="form" onSubmit={handleSubmit} sx={{ mb: 4 }}>
        <TextField
          label="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
          margin="normal"
        />
        <TextField
          label="License Number"
          value={form.license_number}
          onChange={(e) => setForm({ ...form, license_number: e.target.value })}
          required
          margin="normal"
          sx={{ ml: 2 }}
        />
        <TextField
          label="Total Trips"
          type="number"
          value={form.total_trips}
          onChange={(e) => setForm({ ...form, total_trips: e.target.value })}
          margin="normal"
          sx={{ ml: 2 }}
        />
        <TextField
          label="Rating"
          type="number"
          step="0.1"
          value={form.rating}
          onChange={(e) => setForm({ ...form, rating: e.target.value })}
          margin="normal"
          sx={{ ml: 2 }}
        />
        <TextField
          label="Status"
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value })}
          margin="normal"
          sx={{ ml: 2 }}
        />
        <Button type="submit" variant="contained" color="primary" sx={{ mt: 2 }}>
          {editingId ? 'Update Driver' : 'Add Driver'}
        </Button>
        {editingId && (
          <Button variant="outlined" color="secondary" sx={{ mt: 2, ml: 2 }} onClick={() => {
            setEditingId(null);
            setForm({ name: '', license_number: '', total_trips: 0, rating: 0.0, status: 'Available' });
          }}>
            Cancel
          </Button>
        )}
      </Box>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>License Number</TableCell>
            <TableCell>Trips</TableCell>
            <TableCell>Rating</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {drivers.map((d) => (
            <TableRow key={d.id}>
              <TableCell>{d.name}</TableCell>
              <TableCell>{d.license_number}</TableCell>
              <TableCell>{d.total_trips}</TableCell>
              <TableCell>{d.rating}</TableCell>
              <TableCell>{d.status}</TableCell>
              <TableCell>
                <Button variant="outlined" color="primary" onClick={() => handleEdit(d)}>
                  Edit
                </Button>
                <Button variant="outlined" color="error" sx={{ ml: 1 }} onClick={() => handleDelete(d.id)}>
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}

export default DriverList;