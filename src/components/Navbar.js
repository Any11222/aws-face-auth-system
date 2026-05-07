import React from "react";
import { Link, useNavigate } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();

  const handleProfileClick = () => {
    const employeeId = localStorage.getItem("loggedEmployeeId");
    const validUntil = localStorage.getItem("sessionValidUntil");

    if (!employeeId || !validUntil || new Date() > new Date(validUntil)) {
      localStorage.removeItem("loggedEmployeeId");
      localStorage.removeItem("sessionValidUntil");
      alert("Please authenticate again to access profile.");
      navigate("/auth");
    } else {
      navigate("/logs");
    }
  };

  return (
    <div className="navbar">
      <h1>AI Face Authentication Platform</h1>

      <div className="nav-links">
        <Link to="/">Home</Link>
        <Link to="/register">Register</Link>
        <Link to="/auth">Authenticate</Link>
        <span
          onClick={handleProfileClick}
          style={{ marginLeft: "25px", fontWeight: "bold", cursor: "pointer" }}
        >
          My Profile
        </span>
      </div>
    </div>
  );
}

export default Navbar;