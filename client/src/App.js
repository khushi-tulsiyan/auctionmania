import React from 'react';
import { AuctionProvider } from './context/AuctionContext';
import Dashboard from './components/Dashboard';
import './styles/App.css';

function App() {
  return (
    <AuctionProvider>
      <div className="app">
        <Dashboard />
      </div>
    </AuctionProvider>
  );
}

export default App;
