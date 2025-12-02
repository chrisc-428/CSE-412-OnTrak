import './App.css';
import Home from "./pages/Home";
import LoginRegister from "./pages/LoginRegister";
import ProtectedRoute from "./components/ProtectedRoutes";

import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import {useState} from "react";
import axios from "axios";

export default function App() {
    return (
      <Router>
        <Routes>
          <Route path="/" element={<LoginRegister />} />
          <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        </Routes>
      </Router>
    );
}