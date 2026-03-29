import "../src/styles/index.css";

import React from "react";
import { AuthProvider } from "./context/AuthContext";
import AppRouter from "./components/AppRouter";
import { motion } from "framer-motion";

const App: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="bg-white"
    >
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </motion.div>
  );
};

export default App;
