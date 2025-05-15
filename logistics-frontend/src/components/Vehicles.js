import React, { useState, useEffect } from 'react';
import { Typography, Box, TextField, Button, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import { getVehicles, createVehicle, updateVehicle, deleteVehicle } from '../services/api';

function VehicleList() {
  const [vehicles, setVehicles] = useState([]);
  const [form, setForm] = useState({
    registration_number: '',
    model: '',
    status: 'Idle',
    location_lat: '',
    location_lon: '',
  });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const data = await getVehicles();
        setVehicles(data);
      } catch (err) {
        setError('Failed to fetch vehicles');
      }
    };
    fetchVehicles();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const vehicleData = {
        ...form,
        location_lat: form.location_lat ? parseFloat(form.location_lat) : null,
        location_lon: form.location_lon ? parseFloat(form.location_lon) : null,
      };
      if (editingId) {
        const updatedVehicle = await updateVehicle(editingId, vehicleData);
        setVehicles(vehicles.map((v) => (v.id === editingId ? updatedVehicle : v)));
        setEditingId(null);
      } else {
        const newVehicle = await createVehicle(vehicleData);
        setVehicles([...vehicles, newVehicle]);
      }
      setForm({ registration_number: '', model: '', status: 'Idle', location_lat: '', location_lon: '' });
      setError('');
    } catch (err) {
      setError(editingId ? 'Failed to update vehicle' : 'Failed to add vehicle');
    }
  };

  const handleEdit = (vehicle) => {
    setForm({
      registration_number: vehicle.registration_number,
      model: vehicle.model,
      status: vehicle.status,
      location_lat: vehicle.location_lat || '',
      location_lon: vehicle.location_lon || '',
    });
    setEditingId(vehicle.id);
  };

  const handleDelete = async (vehicleId) => {
    try {
      await deleteVehicle(vehicleId);
      setVehicles(vehicles.filter((v) => v.id !== vehicleId));
      setError('');
    } catch (err) {
      setError('Failed to delete vehicle');
    }
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>Vehicle Management</Typography>
      {error && <Typography color="error">{error}</Typography>}
      <Box component="form" onSubmit={handleSubmit} sx={{ mb: 4 }}>
        <TextField
          label="Registration Number"
          value={form.registration_number}
          onChange={(e) => setForm({ ...form, registration_number: e.target.value })}
          required
          margin="normal"
        />
        <TextField
          label="Model"
          value={form.model}
          onChange={(e) => setForm({ ...form, model: e.target.value })}
          required
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
        <TextField
          label="Latitude"
          value={form.location_lat}
          onChange={(e) => setForm({ ...form, location_lat: e.target.value })}
          margin="normal"
          sx={{ ml: 2 }}
        />
        <TextField
          label="Longitude"
          value={form.location_lon}
          onChange={(e) => setForm({ ...form, location_lon: e.target.value })}
          margin="normal"
          sx={{ ml: 2 }}
        />
        <Button type="submit" variant="contained" color="primary" sx={{ mt: 2 }}>
          {editingId ? 'Update Vehicle' : 'Add Vehicle'}
        </Button>
        {editingId && (
          <Button variant="outlined" color="secondary" sx={{ mt: 2, ml: 2 }} onClick={() => {
            setEditingId(null);
            setForm({ registration_number: '', model: '', status: 'Idle', location_lat: '', location_lon: '' });
          }}>
            Cancel
          </Button>
        )}
      </Box>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Registration</TableCell>
            <TableCell>Model</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Location</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {vehicles.map((v) => (
            <TableRow key={v.id}>
              <TableCell>{v.registration_number}</TableCell>
              <TableCell>{v.model}</TableCell>
              <TableCell>{v.status}</TableCell>
              <TableCell>{v.location_lat}, {v.location_lon}</TableCell>
              <TableCell>
                <Button variant="outlined" color="primary" onClick={() => handleEdit(v)}>
                  Edit
                </Button>
                <Button variant="outlined" color="error" sx={{ ml: 1 }} onClick={() => handleDelete(v.id)}>
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

export default VehicleList;