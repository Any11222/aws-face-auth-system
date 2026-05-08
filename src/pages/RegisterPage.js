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

          {/* LIVENESS STATUS BELOW CAMERA */}

          <div
            className="live-status"
            style={{
              marginTop: "18px",
              textAlign: "center",
            }}
          >

            {livenessMsg}

          </div>

        </div>

        {/* RIGHT PANEL */}

        <div className="right-panel">

          <h2
            style={{
              marginBottom: "28px",
            }}
          >
            Employee Registration
          </h2>

          {/* TWO COLUMN FORM */}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "18px",
              width: "100%",
            }}
          >

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

            {/* DATE FIELD FULL WIDTH */}

            <div
              style={{
                gridColumn: "1 / span 2",
              }}
            >

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

          {/* REGISTER BUTTON */}

          <button
            onClick={registerEmployee}
            style={{
              marginTop: "24px",
            }}
          >
            Register Employee
          </button>

          {/* RESULT STATUS */}

          <div
            className="status-box"
            style={{
              marginTop: "20px",
            }}
          >

            {result}

          </div>

        </div>

      </div>

    </div>

  );
}

export default RegisterPage;