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

  const navigate = useNavigate();

  const authenticateEmployee = async () => {

    if (!employeeId) {

      setResult("Please enter Employee ID.");

      return;
    }

    // NO LIVENESS ATTEMPT
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

        // STORE REKOGNITION ID
        localStorage.setItem(
          "loggedEmployeeId",
          res.data.rekognitionid
        );

        // OPTIONAL SESSION STORAGE
        localStorage.setItem(
          "sessionValidUntil",
          res.data.sessionValidUntil
        );

        // SMALL DELAY BEFORE REDIRECT
        setTimeout(() => {

          navigate("/logs");

        }, 500);

      } else {

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

        <div className="left-panel">

          <WebcamCard
            employeeId={employeeId}
            setCapturedImage={setCapturedImage}
            capturedImage={capturedImage}
            setLivenessPassed={setLivenessPassed}
            setLivenessMsg={setLivenessMsg}
            setLivenessAttempted={setLivenessAttempted}
          />

        </div>

        <div className="right-panel">

          <h2>Employee Authentication</h2>

          <input
            type="text"
            placeholder="Enter Employee ID"
            value={employeeId}
            onChange={(e) =>
              setEmployeeId(e.target.value)
            }
          />

          <div className="live-status">
            {livenessMsg}
          </div>

          <button onClick={authenticateEmployee}>
            Authenticate Employee
          </button>

          <div className="status-box">
            {result}
          </div>

        </div>

      </div>

    </div>
  );
}

export default AuthPage;