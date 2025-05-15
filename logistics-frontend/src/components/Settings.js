import React, { useState, useEffect } from 'react';
import { Box, Typography, Tabs, Tab, TextField, Button, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import { getUsers, createUser, updateUser, deleteUser, createBackup, getUserActivity } from '../services/api';

function Settings() {
  const [tab, setTab] = useState(0);
  const [users, setUsers] = useState([]);
  const [activities, setActivities] = useState([]);
  const [form, setForm] = useState({
    username: '', email: '', password: '', role: '', full_name: '', phone: '', department: '', status: 'active'
  });
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [error, setError] = useState('');
  const [editingUserId, setEditingUserId] = useState(null);

  useEffect(() => {
    fetchUsers();
    fetchActivities();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (err) {
      setError('Failed to fetch users');
    }
  };

  const fetchActivities = async () => {
    try {
      const data = await getUserActivity();
      setActivities(data);
    } catch (err) {
      setError('Failed to fetch user activities');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUserId) {
        await updateUser(editingUserId, form);
        setEditingUserId(null);
      } else {
        await createUser(form);
      }
      setForm({ username: '', email: '', password: '', role: '', full_name: '', phone: '', department: '', status: 'active' });
      fetchUsers();
    } catch (err) {
      setError('Failed to save user');
    }
  };

  const handleEdit = (user) => {
    setEditingUserId(user.id);
    setForm({ ...user, password: '' });
  };

  const handleDelete = async (userId) => {
    try {
      await deleteUser(userId);
      fetchUsers();
    } catch (err) {
      setError('Failed to delete user');
    }
  };

  const handleBackup = async () => {
    try {
      const response = await createBackup();
      alert(response.message);
    } catch (err) {
      setError('Failed to create backup');
    }
  };

  const handleSaveSettings = () => {
    localStorage.setItem('refreshInterval', refreshInterval);
    alert('Settings saved');
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>System Settings</Typography>
      {error && <Typography color="error">{error}</Typography>}
      <Tabs value={tab} onChange={(e, v) => setTab(v)}>
        <Tab label="User Management" />
        <Tab label="System Backup" />
        <Tab label="App Settings" />
      </Tabs>
      {tab === 0 && (
        <Box>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Username</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Full Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map(u => (
                <TableRow key={u.id}>
                  <TableCell>{u.username}</TableCell>
                  <TableCell>{u.role}</TableCell>
                  <TableCell>{u.full_name}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>{u.status}</TableCell>
                  <TableCell>
                    <Button onClick={() => handleEdit(u)}>Edit</Button>
                    <Button onClick={() => handleDelete(u.id)} color="error">Delete</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <TextField
              label="Username"
              value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })}
              fullWidth
              margin="normal"
            />
            <TextField
              label="Email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              fullWidth
              margin="normal"
            />
            <TextField
              label="Password"
              type="password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              fullWidth
              margin="normal"
            />
            <TextField
              select
              label="Role"
              value={form.role}
              onChange={e => setForm({ ...form, role: e.target.value })}
              fullWidth
              margin="normal"
            >
              {['admin', 'manager', 'user'].map(r => (
                <MenuItem key={r} value={r}>{r}</MenuItem>
              ))}
            </TextField>
            <TextField
              label="Full Name"
              value={form.full_name}
              onChange={e => setForm({ ...form, full_name: e.target.value })}
              fullWidth
              margin="normal"
            />
            <TextField
              label="Phone"
              value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })}
              fullWidth
              margin="normal"
            />
            <TextField
              label="Department"
              value={form.department}
              onChange={e => setForm({ ...form, department: e.target.value })}
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
              {['active', 'inactive'].map(s => (
                <MenuItem key={s} value={s}>{s}</MenuItem>
              ))}
            </TextField>
            <Button type="submit" variant="contained" sx={{ mt: 2 }}>
              {editingUserId ? 'Update User' : 'Add User'}
            </Button>
          </Box>
          <Typography variant="h6" sx={{ mt: 4 }}>User Activity Log</Typography>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Action</TableCell>
                <TableCell>Details</TableCell>
                <TableCell>Timestamp</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {activities.map(a => (
                <TableRow key={a.activity_id}>
                  <TableCell>{a.action_type}</TableCell>
                  <TableCell>{a.action_details}</TableCell>
                  <TableCell>{new Date(a.timestamp).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      )}
      {tab === 1 && (
        <Box>
          <Button variant="contained" onClick={handleBackup} sx={{ mt: 2 }}>Backup Database Now</Button>
          <Typography sx={{ mt: 2 }}>
            Note: Restore functionality requires manual intervention. Contact support for assistance.
          </Typography>
        </Box>
      )}
      {tab === 2 && (
        <Box>
          <TextField
            label="Data Refresh Interval (seconds)"
            type="number"
            value={refreshInterval}
            onChange={e => setRefreshInterval(e.target.value)}
            fullWidth
            margin="normal"
          />
          <Button variant="contained" onClick={handleSaveSettings} sx={{ mt: 2 }}>Save Settings</Button>
          <Typography variant="h6" sx={{ mt: 4 }}>System Information</Typography>
          <Typography>
            - App Version: 2.0.0<br />
            - Database: PostgreSQL<br />
            - Last Backup: {new Date().toLocaleString()}<br />
            - Server Time: {new Date().toLocaleString()}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default Settings;