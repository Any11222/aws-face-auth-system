from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import boto3
import base64
import uuid
from datetime import datetime, timedelta
from collections import defaultdict
from mangum import Mangum

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

rekognition = boto3.client("rekognition", region_name="us-east-1")
dynamodb = boto3.resource("dynamodb", region_name="us-east-1")

employeeTable = dynamodb.Table("employee")
logsTable = dynamodb.Table("attendance_logs")


class RegisterRequest(BaseModel):
    image: str
    employeeId: str
    firstName: str
    lastName: str
    department: str
    email: str
    phone: str
    joiningDate: str


class SecureAuthRequest(BaseModel):
    employeeId: str
    image: str


def find_employee_by_employeeid(empid):
    data = employeeTable.scan()["Items"]
    for emp in data:
        if emp.get("employeeId") == empid:
            return emp
    return None


def update_failed_attempts(employee):
    failed_attempts = int(employee.get("failedAttempts", 0))
    last_failed = employee.get("lastFailedAttempt", None)

    now = datetime.now()

    if last_failed:
        try:
            old_time = datetime.fromisoformat(last_failed)
            if now - old_time > timedelta(days=7):
                failed_attempts = 0
        except:
            failed_attempts = 0

    failed_attempts += 1
    status = "LOCKED" if failed_attempts >= 5 else "ACTIVE"

    employeeTable.update_item(
        Key={"rekognitionid": employee["rekognitionid"]},
        UpdateExpression="SET failedAttempts = :f, lastFailedAttempt = :l, accountStatus = :s",
        ExpressionAttributeValues={
            ":f": failed_attempts,
            ":l": now.isoformat(),
            ":s": status
        }
    )

    return failed_attempts, status


@app.post("/start-liveness")
def start_liveness():
    try:
        response = rekognition.create_face_liveness_session()
        return {"sessionId": response["SessionId"]}
    except Exception as e:
        print("Liveness Session Error:", e)
        return {"error": "Failed to create liveness session"}


@app.get("/liveness-result/{session_id}")
def get_liveness_result(session_id: str):
    try:
        response = rekognition.get_face_liveness_session_results(SessionId=session_id)
        confidence = response["Confidence"]

        if confidence > 80:
            ref_bytes = response["ReferenceImage"]["Bytes"]
            base64_img = "data:image/jpeg;base64," + base64.b64encode(ref_bytes).decode("utf-8")

            return {
                "success": True,
                "confidence": confidence,
                "referenceImage": base64_img
            }
        else:
            return {
                "success": False,
                "confidence": confidence
            }

    except Exception as e:
        print("Liveness Result Error:", e)
        return {"success": False}


@app.post("/register")
def register(data: RegisterRequest):
    try:
        image_bytes = base64.b64decode(data.image.split(",")[1])

        duplicateCheck = rekognition.search_faces_by_image(
            CollectionId="employees",
            Image={"Bytes": image_bytes},
            FaceMatchThreshold=90,
            MaxFaces=1,
        )

        if len(duplicateCheck["FaceMatches"]) > 0:
            return {
                "success": False,
                "message": "This face is already registered in the system."
            }

        response = rekognition.index_faces(
            CollectionId="employees",
            Image={"Bytes": image_bytes},
        )

        if len(response["FaceRecords"]) == 0:
            return {"success": False, "message": "No face detected"}

        faceId = response["FaceRecords"][0]["Face"]["FaceId"]

        employeeTable.put_item(
            Item={
                "rekognitionid": faceId,
                "employeeId": data.employeeId,
                "firstName": data.firstName,
                "lastName": data.lastName,
                "department": data.department,
                "email": data.email,
                "phone": data.phone,
                "joiningDate": data.joiningDate,
                "profileImage": data.image,
                "failedAttempts": 0,
                "lastFailedAttempt": "",
                "accountStatus": "ACTIVE"
            }
        )

        return {
            "success": True,
            "message": f"Registration Successful for {data.firstName} {data.lastName}"
        }

    except Exception as e:
        print("AWS Register Error:", e)
        return {"success": False, "message": "AWS Registration failed"}

@app.post("/authenticate")
def authenticate(data: SecureAuthRequest):
    try:
        employee = find_employee_by_employeeid(data.employeeId)

        if not employee:
            return {
                "success": False,
                "message": "Employee ID not found."
            }

        if employee.get("accountStatus") == "LOCKED":
            return {
                "success": False,
                "message": "Account is LOCKED due to multiple failed attempts."
            }

        submitted_bytes = base64.b64decode(data.image.split(",")[1])
        registered_bytes = base64.b64decode(employee["profileImage"].split(",")[1])

        compare = rekognition.compare_faces(
            SourceImage={"Bytes": registered_bytes},
            TargetImage={"Bytes": submitted_bytes},
            SimilarityThreshold=85
        )

        if len(compare["FaceMatches"]) > 0:

            similarity_score = str(round(compare["FaceMatches"][0]["Similarity"], 2))

            logsTable.put_item(
                Item={
                    "logid": str(uuid.uuid4()),
                    "rekognitionid": employee["rekognitionid"],
                    "timestamp": str(datetime.now()),
                    "status": "SUCCESS",
                    "confidence": similarity_score
                }
            )

            session_valid_until = (datetime.now() + timedelta(minutes=2)).isoformat()

            return {
                "success": True,
                "message": f"Authentication Success: Welcome {employee['firstName']} {employee['lastName']}",
                "rekognitionid": employee["rekognitionid"],
                "sessionValidUntil": session_valid_until
            }

        else:
            failed, status = update_failed_attempts(employee)

            logsTable.put_item(
                Item={
                    "logid": str(uuid.uuid4()),
                    "rekognitionid": employee["rekognitionid"],
                    "timestamp": str(datetime.now()),
                    "status": "FAILED",
                    "confidence": "0"
                }
            )

            return {
                "success": False,
                "message": f"Face verification failed. Attempt {failed}/5"
            }

    except Exception as e:
        print("Auth Error:", e)
        return {
            "success": False,
            "message": "Authentication error."
        }


@app.post("/report-liveness-failure/{employeeId}")
def report_liveness_failure(employeeId: str):

    employee = find_employee_by_employeeid(employeeId)

    if not employee:
        return {
            "success": False,
            "message": "Employee not found"
        }

    failed, status = update_failed_attempts(employee)

    logsTable.put_item(
        Item={
            "logid": str(uuid.uuid4()),
            "rekognitionid": employee["rekognitionid"],
            "timestamp": str(datetime.now()),
            "status": "FAILED_LIVENESS",
            "confidence": 0
        }
    )

    if status == "LOCKED":

        return {
            "success": False,
            "message": "Account LOCKED due to 5 failed attempts."
        }

    return {
        "success": False,
        "message": f"Spoof detected. Attempt {failed}/5"
    }

@app.get("/employee/{rekognitionid}")
def get_employee_profile(rekognitionid: str):
    try:
        emp = employeeTable.get_item(Key={"rekognitionid": rekognitionid})

        if "Item" not in emp:
            return {"success": False}

        employee = emp["Item"]

        logs = logsTable.scan()["Items"]
        user_logs = [log for log in logs if log["rekognitionid"] == rekognitionid]

        success_logs = [log for log in user_logs if log["status"] == "SUCCESS"]
        success_count = len(success_logs)

        sorted_logs = sorted(user_logs, key=lambda x: x["timestamp"], reverse=True)
        last_login = sorted_logs[0]["timestamp"] if len(sorted_logs) > 0 else "No records"

        current_month = datetime.now().strftime("%Y-%m")

        # UNIQUE PRESENT DAYS ONLY
        present_days_set = set()

        for log in success_logs:
            if log["timestamp"].startswith(current_month):
                only_date = log["timestamp"].split(" ")[0]
                present_days_set.add(only_date)

        present_days = len(present_days_set)

        today_day = datetime.now().day
        absent_days = today_day - present_days if today_day > present_days else 0

        return {
            "success": True,
            "employee": employee,
            "totalAuthentications": success_count,
            "lastLogin": last_login,
            "monthlyAttendance": present_days,
            "presentDays": present_days,
            "absentDays": absent_days,
            "logs": sorted_logs
        }

    except Exception as e:
        print("Employee Profile Error:", e)
        return {"success": False}


@app.delete("/reset-system")
def reset_system():
    try:
        employee_items = employeeTable.scan()["Items"]
        for item in employee_items:
            employeeTable.delete_item(Key={"rekognitionid": item["rekognitionid"]})

        log_items = logsTable.scan()["Items"]
        for item in log_items:
            logsTable.delete_item(Key={"logid": item["logid"]})

        listed_faces = rekognition.list_faces(CollectionId="employees")

        if len(listed_faces["Faces"]) > 0:
            face_ids = [face["FaceId"] for face in listed_faces["Faces"]]

            rekognition.delete_faces(
                CollectionId="employees",
                FaceIds=face_ids
            )

        return {
            "success": True,
            "message": "Entire cloud system reset completed."
        }

    except Exception as e:
        print("Reset Error:", e)
        return {
            "success": False,
            "message": "Reset failed."
        }
@app.get("/")
def home():
    return {"message": "API working"}   
handler = Mangum(app)