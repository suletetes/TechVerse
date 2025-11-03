import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

import "bootstrap/dist/css/bootstrap.min.css";
import "./assets/css/style.css";
import "./assets/css/ecommerce.css";
import "./assets/css/category-enhancements.css";
import "./assets/css/variant-colors.css";

// Development utilities
if (import.meta.env?.DEV) {
  import('./utils/adminDataLoader.js');
  import('./utils/AdminDataManager.js');
  
}

const root = ReactDOM.createRoot(document.getElementById("app"));
root.render(<App />);
