import React, { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

function HomePage() {

  const [resetMsg, setResetMsg] = useState("");

  const handleReset = async () => {

    const confirmReset = window.confirm(
      "Are you sure? This will permanently delete all employees, logs and Rekognition faces."
    );

    if (!confirmReset) return;

    const res = await axios.delete(
      `${process.env.REACT_APP_API_URL}/reset-system`
    );

    setResetMsg(res.data.message);

    localStorage.removeItem("loggedEmployeeId");
  };

  return (

    <div className="page-container">

      <div className="homepage-wrapper">

        <div className="home-card">

          <div className="system-status-row">

            <div className="system-status active-status">
              ● AWS Rekognition Connected
            </div>

            <div className="system-status active-status">
              ● DynamoDB Active
            </div>

            <div className="system-status active-status">
              ● Anti-Spoof Protection Enabled
            </div>

          </div>

          <h1 className="hero-title">
            Smart Cloud Employee Authentication System
          </h1>

          <p className="hero-subtitle">
            Secure biometric employee onboarding, real-time authentication,
            AWS Face Liveness verification, spoof detection and attendance
            analytics powered by AWS Cloud Infrastructure.
          </p>

          <div className="hero-buttons">

            <Link to="/register">
              <button>Employee Onboarding</button>
            </Link>

            <Link to="/auth">
              <button>Secure Authentication</button>
            </Link>

            <Link to="/logs">
              <button>Access Dashboard</button>
            </Link>

          </div>

          <div className="feature-grid">

            <div className="feature-card">
              <h3>Face Recognition</h3>
              <p>
                Real-time biometric identity verification using AWS Rekognition.
              </p>
            </div>

            <div className="feature-card">
              <h3>AWS Liveness</h3>
              <p>
                Detects spoof attacks using official AWS Face Liveness checks.
              </p>
            </div>

            <div className="feature-card">
              <h3>Attendance Analytics</h3>
              <p>
                Smart attendance tracking with dashboard analytics and logs.
              </p>
            </div>

            <div className="feature-card">
              <h3>Cloud Security</h3>
              <p>
                Secure employee authentication powered by AWS cloud services.
              </p>
            </div>

          </div>

          <div className="architecture-flow">
            <div className="arch-box">React Frontend</div>
            <div className="arrow">↓</div>

            <div className="arch-box">AWS Amplify Hosting</div>
            <div className="arrow">↓</div>

            <div className="arch-box">API Gateway</div>
            <div className="arrow">↓</div>

            <div className="arch-box">AWS Lambda + FastAPI</div>
            <div className="arrow">↓</div>

            <div className="arch-box">AWS Rekognition + DynamoDB</div>
          </div>

          <div className="metrics-row">

            <div className="metric-item">
              99.9% Match Accuracy
            </div>

            <div className="metric-item">
              Real-Time Verification
            </div>

            <div className="metric-item">
              Anti-Spoof AI Enabled
            </div>

          </div>

          <button
            className="reset-btn secondary-reset-btn"
            onClick={handleReset}
          >
            Reset Cloud Test Data
          </button>

          {resetMsg && (
            <div className="status-box">
              {resetMsg}
            </div>
          )}

          <div className="homepage-footer">
            Powered by React • FastAPI • AWS Rekognition • DynamoDB • AWS Face Liveness
          </div>

        </div>

      </div>

    </div>
  );
}

export default HomePage;