import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landingpage from "./pages/Customer/Landingpage"; // Updated path
import { AuthProvider } from "./context/AuthContext"; // Updated path (if AuthContext is still in components)
import Dlandingpage from "./pages/Dashboard/Dlandingpage"; // Updated path
import Error from "./pages/Customer/Error"; // Updated path
import { AdminProvider } from "./context/AdminContext"; // Updated path

const App = () => {
  const isonline = true; // Simulate online status

  return (
    <div>
      {isonline ? (
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Customer routes */}
              <Route path="/*" element={<Landingpage />} />

              {/* Admin routes */}
              <Route
                path="/admin/*"
                element={
                  <AdminProvider>
                    <Dlandingpage />
                  </AdminProvider>
                }
              />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      ) : (
        <div>
          <Error />
        </div>
      )}
    </div>
  );
};

export default App;