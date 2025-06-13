// src/index.tsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Find the root DOM node (as defined in public/index.html)
const container = document.getElementById('root');
if (!container) {
  throw new Error("Failed to find the root element");
}

// Create a React root for concurrent mode
const root = ReactDOM.createRoot(container);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app,
// pass a function to log metrics (for example: reportWebVitals(console.log))
// or send them to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
