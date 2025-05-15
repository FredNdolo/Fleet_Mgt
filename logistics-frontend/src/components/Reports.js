import React, { useState, useEffect } from 'react';
import { Box, Typography, MenuItem, TextField, Button } from '@mui/material';
import Plot from 'react-plotly.js';
import { getVehicles, getCosts, getDrivers, getMaintenanceRecords } from '../services/api';
import { CSVLink } from 'react-csv';

function Reports() {
  const [reportType, setReportType] = useState('Fleet Performance');
  const [vehicles, setVehicles] = useState([]);
  const [costs, setCosts] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [maintenanceRecords, setMaintenanceRecords] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [vData, cData, dData, mData] = await Promise.all([
        getVehicles(), getCosts(), getDrivers(), getMaintenanceRecords()
      ]);
      setVehicles(vData);
      setCosts(cData);
      setDrivers(dData);
      setMaintenanceRecords(mData);
    } catch (err) {
      setError('Failed to fetch data');
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

  const getStatusData = () => {
    const statuses = {};
    vehicles.forEach(v => {
      statuses[v.status] = (statuses[v.status] || 0) + 1;
    });
    return { labels: Object.keys(statuses), values: Object.values(statuses) };
  };

  const getMaintenanceData = () => {
    const statuses = {};
    vehicles.forEach(v => {
      const status = checkMaintenanceStatus(v);
      statuses[status] = (statuses[status] || 0) + 1;
    });
    return { labels: Object.keys(statuses), values: Object.values(statuses) };
  };

  const getFuelEfficiencyData = () => {
    return vehicles.map(v => ({
      vehicle: v.registration_number,
      efficiency: Math.random() * 10 + 5 // Simulated km/l
    }));
  };

  const getCostCategoryData = () => {
    const categories = {};
    costs.forEach(c => {
      categories[c.category] = (categories[c.category] || 0) + c.amount;
    });
    return { labels: Object.keys(categories), values: Object.values(categories) };
  };

  const getMonthlyCostData = () => {
    const monthly = {};
    costs.forEach(c => {
      const month = new Date(c.date).toLocaleString('default', { month: 'short', year: 'numeric' });
      monthly[month] = (monthly[month] || 0) + c.amount;
    });
    return { months: Object.keys(monthly), amounts: Object.values(monthly) };
  };

  const filterMaintenanceRecords = () => {
    if (!startDate || !endDate) return maintenanceRecords;
    return maintenanceRecords.filter(r => {
      const date = new Date(r.date);
      return date >= new Date(startDate) && date <= new Date(endDate);
    });
  };

  const getMaintenanceCostByType = () => {
    const types = {};
    filterMaintenanceRecords().forEach(r => {
      types[r.maintenance_type] = (types[r.maintenance_type] || 0) + (r.cost || 0);
    });
    return { labels: Object.keys(types), values: Object.values(types) };
  };

  const getMaintenanceCostByVehicle = () => {
    const vehiclesCost = {};
    filterMaintenanceRecords().forEach(r => {
      const vehicle = vehicles.find(v => v.id === r.vehicle_id)?.registration_number || 'Unknown';
      vehiclesCost[vehicle] = (vehiclesCost[vehicle] || 0) + (r.cost || 0);
    });
    return { vehicles: Object.keys(vehiclesCost), costs: Object.values(vehiclesCost) };
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>Reports & Analytics</Typography>
      {error && <Typography color="error">{error}</Typography>}
      <TextField
        select
        label="Report Type"
        value={reportType}
        onChange={e => setReportType(e.target.value)}
        fullWidth
        sx={{ mb: 2 }}
      >
        {['Fleet Performance', 'Cost Analysis', 'Driver Performance', 'Maintenance History'].map(t => (
          <MenuItem key={t} value={t}>{t}</MenuItem>
        ))}
      </TextField>

      {reportType === 'Fleet Performance' && (
        <Box>
          <TextField
            label="From Date"
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            sx={{ mr: 2 }}
          />
          <TextField
            label="To Date"
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
          />
          <Box sx={{ mt: 2 }}>
            <Plot
              data={[{ type: 'pie', labels: getStatusData().labels, values: getStatusData().values }]}
              layout={{ title: 'Vehicle Status Distribution' }}
            />
            <Plot
              data={[{ type: 'pie', labels: getMaintenanceData().labels, values: getMaintenanceData().values }]}
              layout={{ title: 'Maintenance Status Distribution' }}
            />
            <Plot
              data={[{ type: 'bar', x: getFuelEfficiencyData().map(d => d.vehicle), y: getFuelEfficiencyData().map(d => d.efficiency) }]}
              layout={{ title: 'Fuel Efficiency (km/l)', xaxis: { title: 'Vehicle' }, yaxis: { title: 'Efficiency' } }}
            />
            <CSVLink
              data={vehicles}
              filename={`fleet_report_${new Date().toISOString().split('T')[0]}.csv`}
              style={{ textDecoration: 'none' }}
            >
              <Button variant="contained" sx={{ mt: 2 }}>Download Report (CSV)</Button>
            </CSVLink>
          </Box>
        </Box>
      )}

      {reportType === 'Cost Analysis' && (
        <Box>
          <Typography>Total Costs: KES {costs.reduce((sum, c) => sum + c.amount, 0).toFixed(2)}</Typography>
          <Typography>Average Cost: KES {(costs.reduce((sum, c) => sum + c.amount, 0) / costs.length || 0).toFixed(2)}</Typography>
          <Typography>Records: {costs.length}</Typography>
          <Plot
            data={[{ type: 'pie', labels: getCostCategoryData().labels, values: getCostCategoryData().values }]}
            layout={{ title: 'Cost Distribution by Category' }}
          />
          <Plot
            data={[{ type: 'line', x: getMonthlyCostData().months, y: getMonthlyCostData().amounts, mode: 'lines+markers' }]}
            layout={{ title: 'Monthly Cost Trends', xaxis: { title: 'Month' }, yaxis: { title: 'Total Cost' } }}
          />
          <CSVLink
            data={costs}
            filename={`cost_report_${new Date().toISOString().split('T')[0]}.csv`}
            style={{ textDecoration: 'none' }}
          >
            <Button variant="contained" sx={{ mt: 2 }}>Download Cost Data (CSV)</Button>
          </CSVLink>
        </Box>
      )}

      {reportType === 'Driver Performance' && (
        <Box>
          <Plot
            data={[{ type: 'bar', x: drivers.map(d => d.name), y: drivers.map(d => d.rating) }]}
            layout={{ title: 'Driver Ratings', xaxis: { title: 'Driver' }, yaxis: { title: 'Rating' } }}
          />
          <Plot
            data={[{ type: 'bar', x: drivers.map(d => d.name), y: drivers.map(d => d.total_trips) }]}
            layout={{ title: 'Total Trips Completed', xaxis: { title: 'Driver' }, yaxis: { title: 'Trips' } }}
          />
          <CSVLink
            data={drivers}
            filename={`driver_report_${new Date().toISOString().split('T')[0]}.csv`}
            style={{ textDecoration: 'none' }}
          >
            <Button variant="contained" sx={{ mt: 2 }}>Download Driver Performance Data (CSV)</Button>
          </CSVLink>
        </Box>
      )}

      {reportType === 'Maintenance History' && (
        <Box>
          <TextField
            label="From Date"
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            sx={{ mr: 2 }}
          />
          <TextField
            label="To Date"
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
          />
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Vehicle</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Cost</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Notes</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filterMaintenanceRecords().map(r => (
                <TableRow key={r.record_id}>
                  <TableCell>{vehicles.find(v => v.id === r.vehicle_id)?.registration_number}</TableCell>
                  <TableCell>{r.maintenance_type}</TableCell>
                  <TableCell>{r.date}</TableCell>
                  <TableCell>{r.cost}</TableCell>
                  <TableCell>{r.status}</TableCell>
                  <TableCell>{r.notes}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Plot
            data={[{ type: 'pie', labels: getMaintenanceCostByType().labels, values: getMaintenanceCostByType().values }]}
            layout={{ title: 'Maintenance Costs by Type' }}
          />
          <Plot
            data={[{ type: 'bar', x: getMaintenanceCostByVehicle().vehicles, y: getMaintenanceCostByVehicle().costs }]}
            layout={{ title: 'Maintenance Costs by Vehicle', xaxis: { title: 'Vehicle' }, yaxis: { title: 'Cost' } }}
          />
          <CSVLink
            data={filterMaintenanceRecords()}
            filename={`maintenance_report_${new Date().toISOString().split('T')[0]}.csv`}
            style={{ textDecoration: 'none' }}
          >
            <Button variant="contained" sx={{ mt: 2 }}>Download Maintenance Report (CSV)</Button>
          </CSVLink>
        </Box>
      )}
    </Box>
  );
}

export default Reports;