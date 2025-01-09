import "./styles/App.css";

import React from 'react';
import { AuthProvider } from './context/AuthContext';
import AppRouter from "./components/AppRouter";

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
};

export default App;
