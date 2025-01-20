import "./styles/App.css";

import React from "react";
import { AuthProvider } from "./context/AuthContext";
import AppRouter from "./components/AppRouter";
import { Footer } from "./components/Footer";


const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppRouter />
      <Footer />
    </AuthProvider>
  );
};

export default App;
