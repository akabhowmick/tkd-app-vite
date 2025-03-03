import "./styles/App.css";

import React from "react";
import { AuthProvider } from "./context/AuthContext";
import AppRouter from "./components/AppRouter";
import { Footer } from "./components/Footer";
import { motion } from "framer-motion";

const App: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.5, ease: "easeOut" }} 
    >
      <AuthProvider>
        <AppRouter />
        <Footer />
      </AuthProvider>
    </motion.div>
  );
};

export default App;
