import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableRow,
  TableHead,
  Tabs,
  Tab,
  MenuItem,
} from '@mui/material';
import {
  getVehicles,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  getDrivers,
  createDriver,
  updateDriver,
  deleteDriver,
  getUsers,
  createUser, // Replaced adminRegister with createUser
  updateUser,
  deleteUser,
} from '../services/api';
import { useNavigate } from 'react-router-dom';

function AdminConsole() {
  const [tab, setTab] = useState(0);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [users, setUsers] = useState([]);
  const [userForm, setUserForm] = useState({
    username: '',
    email: '',
    password: '',
    role: 'user',
    full_name: '',
    phone: '',
    department: '',
    status: 'active',
  });
  const [vehicleForm, setVehicleForm] = useState({
    registration_number: '',
    vehicle_type: '', // Changed from model
    capacity: '',
    fuel_type: '',
    status: 'Idle',
    latitude: '',
    longitude: '',
  });
  const [driverForm, setDriverForm] = useState({
    name: '',
    license_number: '',
    license_expiry: '',
    phone: '',
    email: '',
    status: 'Available',
    join_date: '',
    rest_hours: '8.0',
    total_trips: '0',
    rating: '0.0',
    notes: '',
  });
  const [editingUserId, setEditingUserId] = useState(null);
  const [editingVehicleId, setEditingVehicleId] = useState(null);
  const [editingDriverId, setEditingDriverId] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [vehiclesData, driversData, usersData] = await Promise.all([
          getVehicles(),
          getDrivers(),
          getUsers(),
        ]);
        setVehicles(vehiclesData);
        setDrivers(driversData);
        setUsers(usersData);
      } catch (err) {
        setError('Failed to fetch data. Ensure you are logged in as an admin.');
        navigate('/login');
      }
    };
    fetchData();
  }, [navigate]);

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    try {
      const userData = {
        ...userForm,
        password: userForm.password || undefined, // Avoid sending empty password on update
      };
      if (editingUserId) {
        const updatedUser = await updateUser(editingUserId, userData);
        setUsers(users.map((u) => (u.id === editingUserId ? updatedUser : u)));
        setEditingUserId(null);
      } else {
        const newUser = await createUser(userData); // Replaced adminRegister with createUser
        setUsers([...users, newUser]);
      }
      setUserForm({
        username: '',
        email: '',
        password: '',
        role: 'user',
        full_name: '',
        phone: '',
        department: '',
        status: 'active',
      });
      setError('');
      alert(editingUserId ? 'User updated successfully!' : `User ${userForm.username} registered successfully!`);
    } catch (err) {
      const errorMessage = err.response?.data?.detail || (editingUserId ? 'Failed to update user' : 'Failed to register user');
      setError(errorMessage);
    }
  };

  const handleUserEdit = (user) => {
    setUserForm({
      username: user.username,
      email: user.email,
      password: '',
      role: user.role,
      full_name: user.full_name || '',
      phone: user.phone || '',
      department: user.department || '',
      status: user.status || 'active',
    });
    setEditingUserId(user.id);
  };

  const handleUserDelete = async (userId) => {
    try {
      await deleteUser(userId);
      setUsers(users.filter((u) => u.id !== userId));
      setError('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete user');
    }
  };

  const handleVehicleSubmit = async (e) => {
    e.preventDefault();
    try {
      const vehicleData = {
        registration_number: vehicleForm.registration_number,
        vehicle_type: vehicleForm.vehicle_type,
        capacity: vehicleForm.capacity ? parseFloat(vehicleForm.capacity) : null,
        fuel_type: vehicleForm.fuel_type || null,
        status: vehicleForm.status || null,
        latitude: vehicleForm.latitude ? parseFloat(vehicleForm.latitude) : null,
        longitude: vehicleForm.longitude ? parseFloat(vehicleForm.longitude) : null,
      };
      if (editingVehicleId) {
        const updatedVehicle = await updateVehicle(editingVehicleId, vehicleData);
        setVehicles(vehicles.map((v) => (v.id === editingVehicleId ? updatedVehicle : v)));
        setEditingVehicleId(null);
      } else {
        const newVehicle = await createVehicle(vehicleData);
        setVehicles([...vehicles, newVehicle]);
      }
      setVehicleForm({
        registration_number: '',
        vehicle_type: '',
        capacity: '',
        fuel_type: '',
        status: 'Idle',
        latitude: '',
        longitude: '',
      });
      setError('');
    } catch (err) {
      setError(err.response?.data?.detail || (editingVehicleId ? 'Failed to update vehicle' : 'Failed to add vehicle'));
    }
  };

  const handleVehicleEdit = (vehicle) => {
    setVehicleForm({
      registration_number: vehicle.registration_number,
      vehicle_type: vehicle.vehicle_type || '',
      capacity: vehicle.capacity || '',
      fuel_type: vehicle.fuel_type || '',
      status: vehicle.status || 'Idle',
      latitude: vehicle.latitude || '',
      longitude: vehicle.longitude || '',
    });
    setEditingVehicleId(vehicle.id);
  };

  const handleVehicleDelete = async (vehicleId) => {
    try {
      await deleteVehicle(vehicleId);
      setVehicles(vehicles.filter((v) => v.id !== vehicleId));
      setError('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete vehicle');
    }
  };

  const handleDriverSubmit = async (e) => {
    e.preventDefault();
    try {
      const driverData = {
        name: driverForm.name,
        license_number: driverForm.license_number,
        license_expiry: driverForm.license_expiry || null,
        phone: driverForm.phone || null,
        email: driverForm.email || null,
        status: driverForm.status || null,
        join_date: driverForm.join_date || null,
        rest_hours: driverForm.rest_hours ? parseFloat(driverForm.rest_hours) : null,
        total_trips: driverForm.total_trips ? parseInt(driverForm.total_trips) : 0,
        rating: driverForm.rating ? parseFloat(driverForm.rating) : 0.0,
        notes: driverForm.notes || null,
      };
      if (editingDriverId) {
        const updatedDriver = await updateDriver(editingDriverId, driverData);
        setDrivers(drivers.map((d) => (d.id === editingDriverId ? updatedDriver : d)));
        setEditingDriverId(null);
      } else {
        const newDriver = await createDriver(driverData);
        setDrivers([...drivers, newDriver]);
      }
      setDriverForm({
        name: '',
        license_number: '',
        license_expiry: '',
        phone: '',
        email: '',
        status: 'Available',
        join_date: '',
        rest_hours: '8.0',
        total_trips: '0',
        rating: '0.0',
        notes: '',
      });
      setError('');
    } catch (err) {
      setError(err.response?.data?.detail || (editingDriverId ? 'Failed to update driver' : 'Failed to add driver'));
    }
  };

  const handleDriverEdit = (driver) => {
    setDriverForm({
      name: driver.name,
      license_number: driver.license_number,
      license_expiry: driver.license_expiry || '',
      phone: driver.phone || '',
      email: driver.email || '',
      status: driver.status || 'Available',
      join_date: driver.join_date || '',
      rest_hours: driver.rest_hours || '8.0',
      total_trips: driver.total_trips || '0',
      rating: driver.rating || '0.0',
      notes: driver.notes || '',
    });
    setEditingDriverId(driver.id);
  };

  const handleDriverDelete = async (driverId) => {
    try {
      await deleteDriver(driverId);
      setDrivers(drivers.filter((d) => d.id !== driverId));
      setError('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete driver');
    }
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>Admin Console</Typography>
      {error && <Typography color="error">{error}</Typography>}
      <Tabs value={tab} onChange={(e, newValue) => setTab(newValue)}>
        <Tab label="Manage Users" />
        <Tab label="Manage Vehicles" />
        <Tab label="Manage Drivers" />
      </Tabs>

      {tab === 0 && (
        <Box>
          <Box component="form" onSubmit={handleUserSubmit} sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <TextField
              label="Username"
              value={userForm.username}
              onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
              required
              sx={{ flex: '1 1 200px' }}
            />
            <TextField
              label="Email"
              type="email"
              value={userForm.email}
              onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
              required
              sx={{ flex: '1 1 200px' }}
            />
            <TextField
              label="Password"
              type="password"
              value={userForm.password}
              onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
              placeholder={editingUserId ? 'Leave blank to keep unchanged' : ''}
              sx={{ flex: '1 1 200px' }}
            />
            <TextField
              label="Role"
              select
              value={userForm.role}
              onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
              sx={{ flex: '1 1 200px' }}
            >
              <MenuItem value="user">User</MenuItem>
              <MenuItem value="manager">Manager</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </TextField>
            <TextField
              label="Full Name"
              value={userForm.full_name}
              onChange={(e) => setUserForm({ ...userForm, full_name: e.target.value })}
              sx={{ flex: '1 1 200px' }}
            />
            <TextField
              label="Phone"
              value={userForm.phone}
              onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
              sx={{ flex: '1 1 200px' }}
            />
            <TextField
              label="Department"
              value={userForm.department}
              onChange={(e) => setUserForm({ ...userForm, department: e.target.value })}
              sx={{ flex: '1 1 200px' }}
            />
            <TextField
              label="Status"
              select
              value={userForm.status}
              onChange={(e) => setUserForm({ ...userForm, status: e.target.value })}
              sx={{ flex: '1 1 200px' }}
            >
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </TextField>
            <Box sx={{ flex: '1 1 100%', display: 'flex', gap: 2 }}>
              <Button type="submit" variant="contained" color="primary">
                {editingUserId ? 'Update User' : 'Register User'}
              </Button>
              {editingUserId && (
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={() => {
                    setEditingUserId(null);
                    setUserForm({
                      username: '',
                      email: '',
                      password: '',
                      role: 'user',
                      full_name: '',
                      phone: '',
                      department: '',
                      status: 'active',
                    });
                  }}
                >
                  Cancel
                </Button>
              )}
            </Box>
          </Box>
          <Table sx={{ mt: 2 }}>
            <TableHead>
              <TableRow>
                <TableCell>Username</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>{u.username}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>{u.role}</TableCell>
                  <TableCell>{u.status}</TableCell>
                  <TableCell>
                    <Button variant="outlined" color="primary" onClick={() => handleUserEdit(u)}>
                      Edit
                    </Button>
                    <Button variant="outlined" color="error" sx={{ ml: 1 }} onClick={() => handleUserDelete(u.id)}>
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      )}

      {tab === 1 && (
        <Box>
          <Box component="form" onSubmit={handleVehicleSubmit} sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <TextField
              label="Registration Number"
              value={vehicleForm.registration_number}
              onChange={(e) => setVehicleForm({ ...vehicleForm, registration_number: e.target.value })}
              required
              sx={{ flex: '1 1 200px' }}
            />
            <TextField
              label="Vehicle Type"
              value={vehicleForm.vehicle_type}
              onChange={(e) => setVehicleForm({ ...vehicleForm, vehicle_type: e.target.value })}
              required
              sx={{ flex: '1 1 200px' }}
            />
            <TextField
              label="Capacity (kg)"
              type="number"
              value={vehicleForm.capacity}
              onChange={(e) => setVehicleForm({ ...vehicleForm, capacity: e.target.value })}
              sx={{ flex: '1 1 200px' }}
            />
            <TextField
              label="Fuel Type"
              value={vehicleForm.fuel_type}
              onChange={(e) => setVehicleForm({ ...vehicleForm, fuel_type: e.target.value })}
              sx={{ flex: '1 1 200px' }}
            />
            <TextField
              label="Status"
              select
              value={vehicleForm.status}
              onChange={(e) => setVehicleForm({ ...vehicleForm, status: e.target.value })}
              sx={{ flex: '1 1 200px' }}
            >
              <MenuItem value="Idle">Idle</MenuItem>
              <MenuItem value="Active">Active</MenuItem>
              <MenuItem value="Maintenance">Maintenance</MenuItem>
            </TextField>
            <TextField
              label="Latitude"
              type="number"
              value={vehicleForm.latitude}
              onChange={(e) => setVehicleForm({ ...vehicleForm, latitude: e.target.value })}
              sx={{ flex: '1 1 200px' }}
            />
            <TextField
              label="Longitude"
              type="number"
              value={vehicleForm.longitude}
              onChange={(e) => setVehicleForm({ ...vehicleForm, longitude: e.target.value })}
              sx={{ flex: '1 1 200px' }}
            />
            <Box sx={{ flex: '1 1 100%', display: 'flex', gap: 2 }}>
              <Button type="submit" variant="contained" color="primary">
                {editingVehicleId ? 'Update Vehicle' : 'Add Vehicle'}
              </Button>
              {editingVehicleId && (
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={() => {
                    setEditingVehicleId(null);
                    setVehicleForm({
                      registration_number: '',
                      vehicle_type: '',
                      capacity: '',
                      fuel_type: '',
                      status: 'Idle',
                      latitude: '',
                      longitude: '',
                    });
                  }}
                >
                  Cancel
                </Button>
              )}
            </Box>
          </Box>
          <Table sx={{ mt: 2 }}>
            <TableHead>
              <TableRow>
                <TableCell>Registration</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Capacity</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {vehicles.map((v) => (
                <TableRow key={v.id}>
                  <TableCell>{v.registration_number}</TableCell>
                  <TableCell>{v.vehicle_type}</TableCell>
                  <TableCell>{v.capacity}</TableCell>
                  <TableCell>{v.status}</TableCell>
                  <TableCell>
                    {v.latitude}, {v.longitude}
                  </TableCell>
                  <TableCell>
                    <Button variant="outlined" color="primary" onClick={() => handleVehicleEdit(v)}>
                      Edit
                    </Button>
                    <Button variant="outlined" color="error" sx={{ ml: 1 }} onClick={() => handleVehicleDelete(v.id)}>
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      )}

      {tab === 2 && (
        <Box>
          <Box component="form" onSubmit={handleDriverSubmit} sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <TextField
              label="Name"
              value={driverForm.name}
              onChange={(e) => setDriverForm({ ...driverForm, name: e.target.value })}
              required
              sx={{ flex: '1 1 200px' }}
            />
            <TextField
              label="License Number"
              value={driverForm.license_number}
              onChange={(e) => setDriverForm({ ...driverForm, license_number: e.target.value })}
              required
              sx={{ flex: '1 1 200px' }}
            />
            <TextField
              label="License Expiry"
              type="date"
              value={driverForm.license_expiry}
              onChange={(e) => setDriverForm({ ...driverForm, license_expiry: e.target.value })}
              InputLabelProps={{ shrink: true }}
              sx={{ flex: '1 1 200px' }}
            />
            <TextField
              label="Phone"
              value={driverForm.phone}
              onChange={(e) => setDriverForm({ ...driverForm, phone: e.target.value })}
              sx={{ flex: '1 1 200px' }}
            />
            <TextField
              label="Email"
              type="email"
              value={driverForm.email}
              onChange={(e) => setDriverForm({ ...driverForm, email: e.target.value })}
              sx={{ flex: '1 1 200px' }}
            />
            <TextField
              label="Status"
              select
              value={driverForm.status}
              onChange={(e) => setDriverForm({ ...driverForm, status: e.target.value })}
              sx={{ flex: '1 1 200px' }}
            >
              <MenuItem value="Available">Available</MenuItem>
              <MenuItem value="On Trip">On Trip</MenuItem>
              <MenuItem value="Off Duty">Off Duty</MenuItem>
            </TextField>
            <TextField
              label="Join Date"
              type="date"
              value={driverForm.join_date}
              onChange={(e) => setDriverForm({ ...driverForm, join_date: e.target.value })}
              InputLabelProps={{ shrink: true }}
              sx={{ flex: '1 1 200px' }}
            />
            <TextField
              label="Rest Hours"
              type="number"
              value={driverForm.rest_hours}
              onChange={(e) => setDriverForm({ ...driverForm, rest_hours: e.target.value })}
              sx={{ flex: '1 1 200px' }}
            />
            <TextField
              label="Total Trips"
              type="number"
              value={driverForm.total_trips}
              onChange={(e) => setDriverForm({ ...driverForm, total_trips: e.target.value })}
              sx={{ flex: '1 1 200px' }}
            />
            <TextField
              label="Rating"
              type="number"
              step="0.1"
              value={driverForm.rating}
              onChange={(e) => setDriverForm({ ...driverForm, rating: e.target.value })}
              sx={{ flex: '1 1 200px' }}
            />
            <TextField
              label="Notes"
              value={driverForm.notes}
              onChange={(e) => setDriverForm({ ...driverForm, notes: e.target.value })}
              multiline
              sx={{ flex: '1 1 200px' }}
            />
            <Box sx={{ flex: '1 1 100%', display: 'flex', gap: 2 }}>
              <Button type="submit" variant="contained" color="primary">
                {editingDriverId ? 'Update Driver' : 'Add Driver'}
              </Button>
              {editingDriverId && (
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={() => {
                    setEditingDriverId(null);
                    setDriverForm({
                      name: '',
                      license_number: '',
                      license_expiry: '',
                      phone: '',
                      email: '',
                      status: 'Available',
                      join_date: '',
                      rest_hours: '8.0',
                      total_trips: '0',
                      rating: '0.0',
                      notes: '',
                    });
                  }}
                >
                  Cancel
                </Button>
              )}
            </Box>
          </Box>
          <Table sx={{ mt: 2 }}>
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
                    <Button variant="outlined" color="primary" onClick={() => handleDriverEdit(d)}>
                      Edit
                    </Button>
                    <Button variant="outlined" color="error" sx={{ ml: 1 }} onClick={() => handleDriverDelete(d.id)}>
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      )}
    </Box>
  );
}

export default AdminConsole;