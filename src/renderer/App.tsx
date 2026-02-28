import React from 'react';
import { AppProvider } from './store/AppContext';
import Layout from './components/Layout';

export default function App() {
  return (
    <AppProvider>
      <Layout />
    </AppProvider>
  );
}
