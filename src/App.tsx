import "../src/styles/index.css";

import React from "react";
import { AuthProvider } from "./context/AuthContext";
import AppRouter from "./components/AppRouter";
import { motion } from "framer-motion";
import { Sentry } from "./analytics/sentry";

const ErrorFallback = () => (
  <div className="flex flex-col items-center justify-center min-h-screen text-center px-4">
    <p className="text-5xl font-bold text-gray-200 mb-4">Oops</p>
    <h1 className="text-2xl font-semibold text-gray-700 mb-2">Something went wrong</h1>
    <p className="text-gray-500 mb-6">An unexpected error occurred. Please refresh the page.</p>
    <button
      onClick={() => window.location.reload()}
      className="px-5 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
    >
      Reload
    </button>
  </div>
);

const App: React.FC = () => {
  return (
    <Sentry.ErrorBoundary fallback={<ErrorFallback />}>
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
    </Sentry.ErrorBoundary>
  );
};

export default App;
