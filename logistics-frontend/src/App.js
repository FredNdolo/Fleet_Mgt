import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { Box, Drawer, List, ListItem, ListItemText, AppBar, Toolbar, Typography, Button } from '@mui/material';
import Dashboard from './components/Dashboard';
import Vehicles from './components/Vehicles';
import Drivers from './components/Drivers';
import Costs from './components/Costs';
import Maintenance from './components/Maintenance';
import Documents from './components/Documents';
import Reports from './components/Reports';
import Settings from './components/Settings';
import AdminConsole from './components/AdminConsole';
import Login from './components/Login';
import { getCurrentUser, login } from './services/api';

function App() {
  const [user, setUser] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (err) {
        setUser(null);
      }
    };
    if (localStorage.getItem('token')) fetchUser();
  }, []);

  const handleLogin = async (username, password) => {
    try {
      const { access_token } = await login(username, password);
      localStorage.setItem('token', access_token);
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (err) {
      alert('Login failed');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const menuItems = [
    { text: 'Dashboard', path: '/dashboard', roles: ['admin', 'manager', 'user'] },
    { text: 'Vehicles', path: '/vehicles', roles: ['admin', 'manager', 'user'] },
    { text: 'Drivers', path: '/drivers', roles: ['admin', 'manager', 'user'] },
    { text: 'Costs', path: '/costs', roles: ['admin', 'manager', 'user'] },
    { text: 'Maintenance', path: '/maintenance', roles: ['admin', 'manager', 'user'] },
    { text: 'Documents', path: '/documents', roles: ['admin', 'manager', 'user'] },
    { text: 'Reports', path: '/reports', roles: ['admin', 'manager', 'user'] },
    { text: 'Settings', path: '/settings', roles: ['admin'] },
    { text: 'Admin Console', path: '/admin', roles: ['admin'] },
  ];

  return (
    <Router>
      <Box sx={{ display: 'flex' }}>
        {user && (
          <>
            <AppBar position="fixed">
              <Toolbar>
                <Typography variant="h6" sx={{ flexGrow: 1 }}>Universal Logistics SaaS</Typography>
                <Typography sx={{ mr: 2 }}>Welcome, {user.full_name}</Typography>
                <Button color="inherit" onClick={handleLogout}>Logout</Button>
              </Toolbar>
            </AppBar>
            <Drawer
              variant="permanent"
              sx={{ width: 240, flexShrink: 0, [`& .MuiDrawer-paper`]: { width: 240, boxSizing: 'border-box', mt: '64px' } }}
            >
              <List>
                {menuItems
                  .filter(item => item.roles.includes(user.role))
                  .map(item => (
                    <ListItem button key={item.text} component="a" href={item.path}>
                      <ListItemText primary={item.text} />
                    </ListItem>
                  ))}
              </List>
            </Drawer>
          </>
        )}
        <Box component="main" sx={{ flexGrow: 1, p: 3, mt: user ? '64px' : 0 }}>
          <Routes>
            <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login onLogin={handleLogin} />} />
            <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/login" />} />
            <Route path="/vehicles" element={user ? <Vehicles /> : <Navigate to="/login" />} />
            <Route path="/drivers" element={user ? <Drivers /> : <Navigate to="/login" />} />
            <Route path="/costs" element={user ? <Costs /> : <Navigate to="/login" />} />
            <Route path="/maintenance" element={user ? <Maintenance /> : <Navigate to="/login" />} />
            <Route path="/documents" element={user ? <Documents /> : <Navigate to="/login" />} />
            <Route path="/reports" element={user ? <Reports /> : <Navigate to="/login" />} />
            <Route path="/settings" element={user && user.role === 'admin' ? <Settings /> : <Navigate to="/login" />} />
            <Route path="/admin" element={user && user.role === 'admin' ? <AdminConsole /> : <Navigate to="/login" />} />
            <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
          </Routes>
        </Box>
      </Box>
    </Router>
  );
}

export default App;