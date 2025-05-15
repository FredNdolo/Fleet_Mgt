import React, { useState, useEffect } from 'react';
import { Box, Typography, Tabs, Tab, TextField, Button, MenuItem, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import { getVehicles, getDrivers, uploadDriverDocument, getDriverDocuments, uploadVehicleDocument, getVehicleDocuments } from '../services/api';

function Documents() {
  const [tab, setTab] = useState(0);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [driverId, setDriverId] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [driverDocs, setDriverDocs] = useState([]);
  const [vehicleDocs, setVehicleDocs] = useState([]);
  const [driverForm, setDriverForm] = useState({
    doc_type: '', doc_number: '', issue_date: '', expiry_date: '', status: '',
  });
  const [vehicleForm, setVehicleForm] = useState({
    doc_type: '', doc_number: '', issue_date: '', expiry_date: '', status: '',
  });
  const [driverFile, setDriverFile] = useState(null);
  const [vehicleFile, setVehicleFile] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchVehicles();
    fetchDrivers();
  }, []);

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

  const fetchDriverDocs = async (id) => {
    try {
      const data = await getDriverDocuments(id);
      setDriverDocs(data);
    } catch (err) {
      setError('Failed to fetch driver documents');
    }
  };

  const fetchVehicleDocs = async (id) => {
    try {
      const data = await getVehicleDocuments(id);
      setVehicleDocs(data);
    } catch (err) {
      setError('Failed to fetch vehicle documents');
    }
  };

  const handleDriverSubmit = async (e) => {
    e.preventDefault();
    try {
      await uploadDriverDocument(driverId, driverForm, driverFile);
      setDriverForm({ doc_type: '', doc_number: '', issue_date: '', expiry_date: '', status: '' });
      setDriverFile(null);
      fetchDriverDocs(driverId);
    } catch (err) {
      setError('Failed to upload driver document');
    }
  };

  const handleVehicleSubmit = async (e) => {
    e.preventDefault();
    try {
      await uploadVehicleDocument(vehicleId, vehicleForm, vehicleFile);
      setVehicleForm({ doc_type: '', doc_number: '', issue_date: '', expiry_date: '', status: '' });
      setVehicleFile(null);
      fetchVehicleDocs(vehicleId);
    } catch (err) {
      setError('Failed to upload vehicle document');
    }
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>Document Management</Typography>
      {error && <Typography color="error">{error}</Typography>}
      <Tabs value={tab} onChange={(e, v) => setTab(v)}>
        <Tab label="Driver Documents" />
        <Tab label="Vehicle Documents" />
      </Tabs>
      {tab === 0 && (
        <Box>
          <TextField
            select
            label="Driver"
            value={driverId}
            onChange={e => { setDriverId(e.target.value); fetchDriverDocs(e.target.value); }}
            fullWidth
            margin="normal"
          >
            {drivers.map(d => (
              <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
            ))}
          </TextField>
          {driverDocs.length > 0 && (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Type</TableCell>
                  <TableCell>Number</TableCell>
                  <TableCell>Issue Date</TableCell>
                  <TableCell>Expiry Date</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {driverDocs.map(d => (
                  <TableRow key={d.doc_id}>
                    <TableCell>{d.doc_type}</TableCell>
                    <TableCell>{d.doc_number}</TableCell>
                    <TableCell>{d.issue_date}</TableCell>
                    <TableCell>{d.expiry_date}</TableCell>
                    <TableCell>{d.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <Box component="form" onSubmit={handleDriverSubmit} sx={{ mt: 2 }}>
            <TextField
              select
              label="Document Type"
              value={driverForm.doc_type}
              onChange={e => setDriverForm({ ...driverForm, doc_type: e.target.value })}
              fullWidth
              margin="normal"
            >
              {['Driver License', 'ID Card', 'Medical Certificate', 'Other'].map(t => (
                <MenuItem key={t} value={t}>{t}</MenuItem>
              ))}
            </TextField>
            <TextField
              label="Document Number"
              value={driverForm.doc_number}
              onChange={e => setDriverForm({ ...driverForm, doc_number: e.target.value })}
              fullWidth
              margin="normal"
            />
            <TextField
              label="Issue Date"
              type="date"
              value={driverForm.issue_date}
              onChange={e => setDriverForm({ ...driverForm, issue_date: e.target.value })}
              fullWidth
              margin="normal"
            />
            <TextField
              label="Expiry Date"
              type="date"
              value={driverForm.expiry_date}
              onChange={e => setDriverForm({ ...driverForm, expiry_date: e.target.value })}
              fullWidth
              margin="normal"
            />
            <TextField
              select
              label="Status"
              value={driverForm.status}
              onChange={e => setDriverForm({ ...driverForm, status: e.target.value })}
              fullWidth
              margin="normal"
            >
              {['Valid', 'Expired', 'Pending'].map(s => (
                <MenuItem key={s} value={s}>{s}</MenuItem>
              ))}
            </TextField>
            <input
              type="file"
              accept=".png,.jpg,.pdf"
              onChange={e => setDriverFile(e.target.files[0])}
            />
            <Button type="submit" variant="contained" sx={{ mt: 2 }}>Upload Document</Button>
          </Box>
        </Box>
      )}
      {tab === 1 && (
        <Box>
          <TextField
            select
            label="Vehicle"
            value={vehicleId}
            onChange={e => { setVehicleId(e.target.value); fetchVehicleDocs(e.target.value); }}
            fullWidth
            margin="normal"
          >
            {vehicles.map(v => (
              <MenuItem key={v.id} value={v.id}>{v.registration_number}</MenuItem>
            ))}
          </TextField>
          {vehicleDocs.length > 0 && (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Type</TableCell>
                  <TableCell>Number</TableCell>
                  <TableCell>Issue Date</TableCell>
                  <TableCell>Expiry Date</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {vehicleDocs.map(d => (
                  <TableRow key={d.doc_id}>
                    <TableCell>{d.doc_type}</TableCell>
                    <TableCell>{d.doc_number}</TableCell>
                    <TableCell>{d.issue_date}</TableCell>
                    <TableCell>{d.expiry_date}</TableCell>
                    <TableCell>{d.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <Box component="form" onSubmit={handleVehicleSubmit} sx={{ mt: 2 }}>
            <TextField
              select
              label="Document Type"
              value={vehicleForm.doc_type}
              onChange={e => setVehicleForm({ ...vehicleForm, doc_type: e.target.value })}
              fullWidth
              margin="normal"
            >
              {['Insurance', 'Registration', 'Inspection Certificate', 'Other'].map(t => (
                <MenuItem key={t} value={t}>{t}</MenuItem>
              ))}
            </TextField>
            <TextField
              label="Document Number"
              value={vehicleForm.doc_number}
              onChange={e => setVehicleForm({ ...vehicleForm, doc_number: e.target.value })}
              fullWidth
              margin="normal"
            />
            <TextField
              label="Issue Date"
              type="date"
              value={vehicleForm.issue_date}
              onChange={e => setVehicleForm({ ...vehicleForm, issue_date: e.target.value })}
              fullWidth
              margin="normal"
            />
            <TextField
              label="Expiry Date"
              type="date"
              value={vehicleForm.expiry_date}
              onChange={e => setVehicleForm({ ...vehicleForm, expiry_date: e.target.value })}
              fullWidth
              margin="normal"
            />
            <TextField
              select
              label="Status"
              value={vehicleForm.status}
              onChange={e => setVehicleForm({ ...vehicleForm, status: e.target.value })}
              fullWidth
              margin="normal"
            >
              {['Valid', 'Expired', 'Pending'].map(s => (
                <MenuItem key={s} value={s}>{s}</MenuItem>
              ))}
            </TextField>
            <input
              type="file"
              accept=".png,.jpg,.pdf"
              onChange={e => setVehicleFile(e.target.files[0])}
            />
            <Button type="submit" variant="contained" sx={{ mt: 2 }}>Upload Document</Button>
          </Box>
        </Box>
      )}
    </Box>
  );
}

export default Documents;