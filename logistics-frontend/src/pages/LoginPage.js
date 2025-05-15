import React from 'react';
import Login from '../components/Login';

function LoginPage() {
  const setToken = (token) => {
    // Handle token in parent if needed
  };

  return <Login setToken={setToken} />;
}

export default LoginPage;