// src/index.js
import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css'; // keep CRA default or leave empty
import App from './App';
createRoot(document.getElementById('root')).render(<React.StrictMode><App/></React.StrictMode>);
