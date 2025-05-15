import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1a237e', // Deep indigo
    },
    secondary: {
      main: '#ff6f00', // Vibrant amber
    },
    background: {
      default: '#f5f7fa', // Light gray
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h2: {
      fontWeight: 700,
      color: '#1a237e',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          padding: '10px 20px',
        },
      },
    },
  },
});

export default theme;