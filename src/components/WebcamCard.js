import React, { useState } from "react";
import axios from "axios";
import { Amplify } from "aws-amplify";
import { FaceLivenessDetector } from "@aws-amplify/ui-react-liveness";
import "@aws-amplify/ui-react/styles.css";
import awsconfig from "../awsConfig";

Amplify.configure(awsconfig);

function WebcamCard({
  employeeId,
  setCapturedImage,
  capturedImage,
  setLivenessPassed,
  setLivenessMsg,
  setLivenessAttempted,
}) {

  const [sessionId, setSessionId] = useState(null);

  const startLiveness = async () => {

    setLivenessPassed(false);

    setCapturedImage(null);

    // SAFE CHECK
    if (setLivenessAttempted) {
      setLivenessAttempted(false);
    }

    setLivenessMsg(
      "Starting Official AWS Face Liveness..."
    );

    const res = await axios.post(
      `${process.env.REACT_APP_API_URL}/start-liveness`
    );

    if (res.data.sessionId) {

      setSessionId(res.data.sessionId);

    } else {

      setLivenessMsg(
        "Failed to create liveness session"
      );
    }
  };

  const handleAnalysisComplete = async () => {

    // SAFE CHECK
    if (setLivenessAttempted) {
      setLivenessAttempted(true);
    }

    setLivenessMsg(
      "Fetching AWS Verified Reference Image..."
    );

    const result = await axios.get(
      `${process.env.REACT_APP_API_URL}/liveness-result/${sessionId}`
    );

    if (result.data.success) {

      setLivenessPassed(true);

      setCapturedImage(
        result.data.referenceImage
      );

      setSessionId(null);

      setLivenessMsg(
        "Official AWS Face Liveness Passed"
      );

    } else {

      setLivenessPassed(false);

      setSessionId(null);

      setLivenessMsg(
        "Spoof Detected / Liveness Failed"
      );

      localStorage.removeItem(
        "loggedEmployeeId"
      );

      localStorage.removeItem(
        "sessionValidUntil"
      );

      if (employeeId) {

        try {

          await axios.post(
            `${process.env.REACT_APP_API_URL}/report-liveness-failure/${employeeId}`
          );

        } catch (err) {

          console.log(
            "Failed to record spoof attempt"
          );
        }
      }
    }
  };

  return (

    <div className="camera-panel">

      <div className="camera-frame">

        {!sessionId && !capturedImage ? (

          <button onClick={startLiveness}>
            Start Official AWS Liveness
          </button>

        ) : sessionId ? (

          <div
            style={{
              width: "420px",
              margin: "auto",
            }}
          >

            <FaceLivenessDetector
              sessionId={sessionId}
              region="us-east-1"
              onAnalysisComplete={handleAnalysisComplete}

              onError={(error) => {

                console.log(error);

                setSessionId(null);

                setLivenessMsg(
                  "AWS Liveness Detector Error"
                );
              }}
            />

          </div>

        ) : (

          <div className="verified-wrapper">

            <img
              src={capturedImage}
              alt="verified"
              className="webcam-view"
            />

            <div className="verified-badge">
              ✔ VERIFIED
            </div>

          </div>

        )}

      </div>

    </div>
  );
}

export default WebcamCard;  