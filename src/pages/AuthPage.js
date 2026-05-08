import React, { useState } from "react";
import axios from "axios";
import WebcamCard from "../components/WebcamCard";
import { useNavigate } from "react-router-dom";

function AuthPage() {

  const [employeeId, setEmployeeId] = useState("");

  const [capturedImage, setCapturedImage] = useState(null);

  const [livenessPassed, setLivenessPassed] = useState(false);

  const [livenessAttempted, setLivenessAttempted] = useState(false);

  const [livenessMsg, setLivenessMsg] = useState("");

  const [result, setResult] = useState("");

  const [authSuccess, setAuthSuccess] = useState(false);

  const navigate = useNavigate();

  const authenticateEmployee = async () => {

    if (!employeeId) {

      setResult("Please enter Employee ID.");

      return;
    }

    if (!capturedImage) {

      if (!livenessAttempted) {

        setResult(
          "Please complete AWS Face Liveness first."
        );

      } else {

        setResult(livenessMsg);

      }

      return;
    }

    try {

      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/authenticate`,
        {
          employeeId: employeeId,
          image: capturedImage,
        }
      );

      setResult(res.data.message);

      console.log(res.data);

      if (res.data.success) {

        localStorage.setItem(
          "loggedEmployeeId",
          res.data.rekognitionid
        );

        localStorage.setItem(
          "sessionValidUntil",
          res.data.sessionValidUntil
        );

        setAuthSuccess(true);

      } else {

        setAuthSuccess(false);

        localStorage.removeItem(
          "loggedEmployeeId"
        );

        localStorage.removeItem(
          "sessionValidUntil"
        );
      }

    } catch (err) {

      setResult(
        "Authentication server error."
      );

      setAuthSuccess(false);

      localStorage.removeItem(
        "loggedEmployeeId"
      );

      localStorage.removeItem(
        "sessionValidUntil"
      );
    }
  };

  return (

    <div className="page-container">

      <div className="split-card">

        {/* LEFT PANEL */}

        <div className="left-panel">

          <WebcamCard
            employeeId={employeeId}
            setCapturedImage={setCapturedImage}
            capturedImage={capturedImage}
            setLivenessPassed={setLivenessPassed}
            setLivenessMsg={setLivenessMsg}
            setLivenessAttempted={setLivenessAttempted}
          />

          {/* LIVENESS STATUS */}

          <div className="live-status camera-status">

            {livenessMsg}

          </div>

        </div>

        {/* RIGHT PANEL */}

        <div className="right-panel auth-panel">

          <h2 className="auth-title">
            Employee Authentication
          </h2>

          <input
            type="text"
            placeholder="Enter Employee ID"
            value={employeeId}
            onChange={(e) =>
              setEmployeeId(e.target.value)
            }
          />

          <button
            onClick={authenticateEmployee}
            className="primary-btn"
          >
            Authenticate Employee
          </button>

          <div className="status-box auth-status-box">

            {result}

          </div>

          {authSuccess && (

            <button
              onClick={() => navigate("/logs")}
              className="dashboard-btn"
            >
              Go to Dashboard
            </button>

          )}

          {/* SECURITY INFO */}

          <div className="security-info">

            <div>
              🔐 Secured by AWS AI Services
            </div>

            <div>
              Real-Time Face Liveness Detection
            </div>

            <div>
              Powered by Amazon Rekognition
            </div>

          </div>

        </div>

      </div>

    </div>

  );
}

export default AuthPage;