import React from 'react';
import { Link } from 'react-router-dom';
import { Container, Typography, Button } from '@mui/material';

function Home() {
  return (
    <Container>
      <Typography variant="h2" gutterBottom>
        Universal Logistics SaaS
      </Typography>
      <Typography variant="h5" gutterBottom>
        Manage your fleet with ease and efficiency.
      </Typography>
      <Button variant="contained" color="primary" component={Link} to="/login">
        Get Started
      </Button>
    </Container>
  );
}

export default Home;