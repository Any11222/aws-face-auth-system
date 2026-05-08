import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

function LogsPage() {

  const [profile, setProfile] = useState(null);

  const [showAllLogs, setShowAllLogs] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {

    const employeeId = localStorage.getItem("loggedEmployeeId");

    // SIMPLE LOGIN CHECK
    if (!employeeId) {

      navigate("/auth");

      return;
    }

    // FETCH PROFILE
    axios
      .get(
        `${process.env.REACT_APP_API_BASE}/employee/${employeeId}`
      )
      .then((res) => {

        if (res.data.success) {

          setProfile(res.data);

        } else {

          navigate("/auth");
        }
      })
      .catch(() => {

        localStorage.removeItem("loggedEmployeeId");

        navigate("/auth");
      });

  }, [navigate]);

  if (!profile) return null;

  const emp = profile.employee;

  const formatDate = (raw) => {
    return new Date(raw).toLocaleString("en-IN");
  };

  const getStatusClass = (status) => {
    if (status === "SUCCESS") return "log-success";
    if (status === "FAILED") return "log-failed";
    if (status === "FAILED_LIVENESS") return "log-spoof";
    return "";
  };

  const getStatusLabel = (status) => {
    if (status === "SUCCESS") return "AUTH SUCCESS";
    if (status === "FAILED") return "FACE MISMATCH";
    if (status === "FAILED_LIVENESS") return "SPOOF DETECTED";
    return status;
  };

  const pieData = [
    { name: "Present", value: profile.presentDays },
    { name: "Absent", value: profile.absentDays },
  ];

  const attendancePercent = Math.round(
    (profile.presentDays /
      (profile.presentDays + profile.absentDays)) * 100
  );

  const shownLogs = showAllLogs
    ? profile.logs
    : profile.logs.slice(0, 5);

  return (
    <div className="page-container">

      <div className="profile-main-card">

        <div className="stats-row">

          <div className="stat-box">
            <h3>{profile.totalAuthentications}</h3>
            <p>Total Authentications</p>
          </div>

          <div className="stat-box">
            <h3>{profile.monthlyAttendance}</h3>
            <p>Present Days This Month</p>
          </div>

          <div className="stat-box">
            <h3>{emp.accountStatus}</h3>
            <p>Account Status</p>
          </div>

          <div className="stat-box">
            <h3>{emp.failedAttempts}</h3>
            <p>Failed Attempts</p>
          </div>

        </div>

        <div className="profile-top">

          <div className="profile-left">

            <img
              src={emp.profileImage}
              alt="profile"
              className="big-profile-pic"
            />

            <h2>
              {emp.firstName} {emp.lastName}
            </h2>

            <p>{emp.department}</p>

          </div>

          <div className="profile-right-flex">

            <div className="employee-details">

              <h2>Employee Information</h2>

              <p>
                <strong>Employee ID:</strong> {emp.employeeId}
              </p>

              <p>
                <strong>Email:</strong> {emp.email}
              </p>

              <p>
                <strong>Phone:</strong> {emp.phone}
              </p>

              <p>
                <strong>Joining Date:</strong> {emp.joiningDate}
              </p>

              <p>
                <strong>Last Login:</strong>{" "}
                {formatDate(profile.lastLogin)}
              </p>

            </div>

            <div className="attendance-chart-box">

              <h3>Monthly Attendance</h3>

              <PieChart width={250} height={210}>

                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={42}
                  outerRadius={68}
                  dataKey="value"
                  label
                >

                  <Cell fill="#10b981" />
                  <Cell fill="#ef4444" />

                </Pie>

                <Tooltip />
                <Legend />

              </PieChart>

              <div className="attendance-percent-text">
                {attendancePercent}% Present
              </div>

            </div>

          </div>

        </div>

        <div className="history-section">

          <h2>Authentication History</h2>

          {shownLogs.map((log, index) => (

            <div
              className={`log-row ${getStatusClass(log.status)}`}
              key={index}
            >

              <div className="log-col time-col">
                {formatDate(log.timestamp)}
              </div>

              <div className="log-col status-col">
                {getStatusLabel(log.status)}
              </div>

              <div className="log-col confidence-col">
                Match Confidence: {log.confidence || 0}%
              </div>

            </div>

          ))}

          {profile.logs.length > 5 && (

            <button
              className="show-more-btn"
              onClick={() =>
                setShowAllLogs(!showAllLogs)
              }
            >
              {showAllLogs
                ? "Show Less"
                : "Show More"}
            </button>

          )}

        </div>

      </div>

    </div>
  );
}

export default LogsPage;