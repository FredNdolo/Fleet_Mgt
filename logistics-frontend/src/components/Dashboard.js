import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Grid, Card, CardContent } from '@mui/material';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import Plot from 'react-plotly.js';
import { getVehicles, getDrivers, getSimulatedUpdates, optimizeRoute } from '../services/api';
import 'leaflet/dist/leaflet.css';

function Dashboard() {
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [error, setError] = useState('');
  const [refreshInterval, setRefreshInterval] = useState(localStorage.getItem('refreshInterval') || 30);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  const fetchData = async () => {
    try {
      const { vehicles, drivers } = await getSimulatedUpdates();
      setVehicles(vehicles);
      setDrivers(drivers);
    } catch (err) {
      setError('Failed to fetch data');
    }
  };

  const handleOptimizeRoute = async (vehicleId) => {
    try {
      const result = await optimizeRoute(vehicleId);
      alert(`Vehicle ${vehicleId}: ${result.fuel_saved_percent.toFixed(1)}% fuel saved, ${result.time_saved_percent.toFixed(1)}% time saved, ${result.carbon_reduction.toFixed(2)} kg CO2 reduced.`);
    } catch (err) {
      setError('Failed to optimize route');
    }
  };

  const checkMaintenanceStatus = (vehicle) => {
    const daysSinceMaintenance = vehicle.last_maintenance 
      ? Math.floor((new Date() - new Date(vehicle.last_maintenance)) / (1000 * 60 * 60 * 24))
      : 365;
    if (vehicle.maintenance_score < 30 || daysSinceMaintenance > 180) return 'Needs Service';
    if (vehicle.maintenance_score < 50 || daysSinceMaintenance > 120) return 'Schedule Soon';
    return 'Good';
  };

  const getActiveDriver = () => {
    const activeVehicle = vehicles.find(v => v.status === 'Active' && v.driver_id);
    if (!activeVehicle) return null;
    return drivers.find(d => d.id === activeVehicle.driver_id);
  };

  const activeDriver = getActiveDriver();

  const customIcon = (status) =>
    new L.Icon({
      iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${status === 'Active' ? 'green' : 'red'}.png`,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
    });

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>Universal Logistics Dashboard</Typography>
      {error && <Typography color="error">{error}</Typography>}
      <Button variant="contained" onClick={() => vehicles.forEach(v => handleOptimizeRoute(v.id))} sx={{ mb: 2 }}>
        Simulate Route Optimization
      </Button>
      <Grid container spacing={2}>
        <Grid item xs={3}>
          <Card><CardContent><Typography variant="h6">Total Vehicles</Typography><Typography>{vehicles.length}</Typography></CardContent></Card>
        </Grid>
        <Grid item xs={3}>
          <Card><CardContent><Typography variant="h6">Active Vehicles</Typography><Typography>{vehicles.filter(v => v.status === 'Active').length}</Typography></CardContent></Card>
        </Grid>
        <Grid item xs={3}>
          <Card><CardContent><Typography variant="h6">Avg. Fuel Level</Typography><Typography>{(vehicles.reduce((sum, v) => sum + v.fuel_level, 0) / vehicles.length || 0).toFixed(1)}%</Typography></CardContent></Card>
        </Grid>
        <Grid item xs={3}>
          <Card><CardContent><Typography variant="h6">Total Carbon Emissions</Typography><Typography>{(vehicles.reduce((sum, v) => sum + v.fuel_level * 2.68, 0)).toFixed(2)} kg CO2</Typography></CardContent></Card>
        </Grid>
      </Grid>
      <Grid container spacing={2} sx={{ mt: 2 }}>
        <Grid item xs={8}>
          <Typography variant="h6">Vehicle Tracking</Typography>
          <MapContainer center={[-1.2921, 36.8219]} zoom={7} style={{ height: '400px' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {vehicles.map(v => (
              <Marker key={v.id} position={[v.latitude, v.longitude]} icon={customIcon(v.status)}>
                <Popup>
                  <b>{v.registration_number}</b><br />
                  Type: {v.vehicle_type}<br />
                  Status: {v.status}<br />
                  Driver: {drivers.find(d => d.id === v.driver_id)?.name || 'None'}<br />
                  Speed: {v.speed.toFixed(1)} km/h<br />
                  Fuel: {v.fuel_level.toFixed(1)}%<br />
                  Maintenance: {checkMaintenanceStatus(v)}
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </Grid>
        <Grid item xs={4}>
          <Typography variant="h6">Fleet Status</Typography>
          <Plot
            data={[{ type: 'indicator', mode: 'gauge+number', value: vehicles.reduce((sum, v) => sum + v.speed, 0) / vehicles.length || 0, gauge: { axis: { range: [0, 120] }, steps: [{ range: [0, 30], color: 'lightgreen' }, { range: [30, 70], color: 'yellow' }, { range: [70, 120], color: 'red' }], threshold: { value: 90, line: { color: 'red', width: 4 } } } }]}
            layout={{ title: 'Average Fleet Speed (km/h)', height: 200 }}
          />
          <Plot
            data={[{ type: 'pie', labels: ['Needs Service', 'Schedule Soon', 'Good'], values: vehicles.reduce((acc, v) => {
              const status = checkMaintenanceStatus(v);
              acc[status === 'Needs Service' ? 0 : status === 'Schedule Soon' ? 1 : 2]++;
              return acc;
            }, [0, 0, 0]) }]}
            layout={{ title: 'Maintenance Status Distribution', height: 200 }}
          />
        </Grid>
      </Grid>
      <Grid container spacing={2} sx={{ mt: 2 }}>
        <Grid item xs={6}>
          <Plot
            data={[{ type: 'bar', x: vehicles.map(v => v.registration_number), y: vehicles.map(v => v.fuel_level), marker: { color: vehicles.map(v => v.fuel_level), colorscale: 'RdYlGn' } }]}
            layout={{ title: 'Vehicle Fuel Levels', xaxis: { title: 'Vehicle' }, yaxis: { title: 'Fuel Level (%)', range: [0, 100] } }}
          />
        </Grid>
        <Grid item xs={6}>
          <Plot
            data={[{ type: 'bar', x: vehicles.map(v => v.registration_number), y: vehicles.map(v => v.fuel_level * 2.68), marker: { color: vehicles.map(v => v.fuel_level * 2.68), colorscale: 'Reds' } }]}
            layout={{ title: 'Estimated Carbon Emissions by Vehicle', xaxis: { title: 'Vehicle' }, yaxis: { title: 'Carbon Emissions (kg CO2)' } }}
          />
        </Grid>
      </Grid>
      {activeDriver && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6">Active Driver Profile</Typography>
          <Card>
            <CardContent>
              <Typography variant="h5">{activeDriver.name}</Typography>
              <Typography>License: {activeDriver.license_number}</Typography>
              <Typography>Experience: {activeDriver.total_trips} trips</Typography>
              <Typography>Rating: {activeDriver.rating.toFixed(1)}/5</Typography>
              <Typography>Status: {activeDriver.status}</Typography>
            </CardContent>
          </Card>
        </Box>
      )}
    </Box>
  );
}

export default Dashboard;