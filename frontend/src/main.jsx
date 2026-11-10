import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

// Bootstrap 5 & Icons
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

// Custom & Print Styles
import './styles/custom.css';
import './styles/print.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
