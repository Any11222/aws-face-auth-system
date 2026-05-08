import React, { useState } from "react";
import axios from "axios";
import WebcamCard from "../components/WebcamCard";

function RegisterPage() {

  const [capturedImage, setCapturedImage] = useState(null);

  const [livenessPassed, setLivenessPassed] = useState(false);

  const [livenessMsg, setLivenessMsg] = useState("");

  const [result, setResult] = useState("");

  const [employeeId, setEmployeeId] = useState("");

  const [firstName, setFirstName] = useState("");

  const [lastName, setLastName] = useState("");

  const [department, setDepartment] = useState("");

  const [email, setEmail] = useState("");

  const [phone, setPhone] = useState("");

  const [joiningDate, setJoiningDate] = useState("");

  const registerEmployee = async () => {

    if (!livenessPassed || !capturedImage) {

      setResult(
        "Please complete AWS Face Liveness first."
      );

      return;
    }

    if (
      !employeeId ||
      !firstName ||
      !lastName ||
      !department ||
      !email ||
      !phone ||
      !joiningDate
    ) {

      setResult(
        "Please fill all employee details."
      );

      return;
    }

    const res = await axios.post(
      `${process.env.REACT_APP_API_URL}/register`,
      {
        image: capturedImage,
        employeeId,
        firstName,
        lastName,
        department,
        email,
        phone,
        joiningDate,
      }
    );

    setResult(res.data.message);
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
          />

          {/* LIVENESS STATUS */}

          <div className="live-status camera-status">

            {livenessMsg}

          </div>

        </div>

        {/* RIGHT PANEL */}

        <div className="right-panel">

          <h2 className="auth-title">
            Employee Registration
          </h2>

          <div className="register-grid">

            <input
              type="text"
              placeholder="Employee ID"
              value={employeeId}
              onChange={(e) =>
                setEmployeeId(e.target.value)
              }
            />

            <input
              type="text"
              placeholder="First Name"
              value={firstName}
              onChange={(e) =>
                setFirstName(e.target.value)
              }
            />

            <input
              type="text"
              placeholder="Last Name"
              value={lastName}
              onChange={(e) =>
                setLastName(e.target.value)
              }
            />

            <input
              type="text"
              placeholder="Department"
              value={department}
              onChange={(e) =>
                setDepartment(e.target.value)
              }
            />

            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
            />

            <input
              type="text"
              placeholder="Phone Number"
              value={phone}
              onChange={(e) =>
                setPhone(e.target.value)
              }
            />

            <div className="full-width-date">

              <label className="date-label">
                Joining Date
              </label>

              <input
                type="date"
                value={joiningDate}
                onChange={(e) =>
                  setJoiningDate(e.target.value)
                }
                style={{
                  width: "100%",
                }}
              />

            </div>

          </div>

          <button
            onClick={registerEmployee}
            className="primary-btn"
          >
            Register Employee
          </button>

          <div className="status-box auth-status-box">

            {result}

          </div>

        </div>

      </div>

    </div>

  );
}

export default RegisterPage;