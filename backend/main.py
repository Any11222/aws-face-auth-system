from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import boto3
import base64
import uuid
from datetime import datetime, timedelta
import pytz

app = FastAPI()

# =========================
# CORS
# =========================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://main.dgwc8cf4rvfok.amplifyapp.com"
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================
# AWS CLIENTS
# =========================

rekognition = boto3.client("rekognition", region_name="us-east-1")

dynamodb = boto3.resource(
    "dynamodb",
    region_name="us-east-1"
)

employees_table = dynamodb.Table("employees")
attendance_table = dynamodb.Table("attendance_logs")

COLLECTION_ID = "employee-face-collection"

# =========================
# IST TIMEZONE
# =========================

IST = pytz.timezone("Asia/Kolkata")

# =========================
# REQUEST MODELS
# =========================

class RegisterRequest(BaseModel):
    employeeId: str
    name: str
    department: str
    image: str


class AuthRequest(BaseModel):
    employeeId: str
    image: str

# =========================
# HOME
# =========================

@app.get("/")
def root():
    return {
        "message": "AWS Face Authentication Backend Running"
    }

# =========================
# REGISTER EMPLOYEE
# =========================

@app.post("/register")
def register_employee(data: RegisterRequest):

    image_bytes = base64.b64decode(data.image)

    response = rekognition.index_faces(
        CollectionId=COLLECTION_ID,
        Image={"Bytes": image_bytes},
        ExternalImageId=data.employeeId,
        DetectionAttributes=[]
    )

    if not response["FaceRecords"]:
        return {
            "success": False,
            "message": "No face detected."
        }

    rekognition_id = response["FaceRecords"][0]["Face"]["FaceId"]

    employees_table.put_item(
        Item={
            "employeeId": data.employeeId,
            "name": data.name,
            "department": data.department,
            "rekognitionid": rekognition_id,
            "registeredAt": datetime.now(IST).strftime("%d/%m/%Y, %I:%M:%S %p")
        }
    )

    return {
        "success": True,
        "message": "Employee registered successfully"
    }

# =========================
# AUTHENTICATE EMPLOYEE
# =========================

@app.post("/authenticate")
def authenticate_employee(data: AuthRequest):

    image_bytes = base64.b64decode(data.image)

    response = rekognition.search_faces_by_image(
        CollectionId=COLLECTION_ID,
        Image={"Bytes": image_bytes},
        MaxFaces=1,
        FaceMatchThreshold=90
    )

    current_time = datetime.now(IST).strftime(
        "%d/%m/%Y, %I:%M:%S %p"
    )

    # =========================
    # NO MATCH
    # =========================

    if not response["FaceMatches"]:

        attendance_table.put_item(
            Item={
                "logid": str(uuid.uuid4()),
                "rekognitionid": "UNKNOWN",
                "confidence": 0,
                "status": "FAILED",
                "timestamp": current_time
            }
        )

        return {
            "success": False,
            "message": "Face not recognized"
        }

    match = response["FaceMatches"][0]

    confidence = float(match["Similarity"])

    rekognition_id = match["Face"]["FaceId"]

    employee_response = employees_table.scan()

    employee_data = None

    for item in employee_response["Items"]:

        if item["rekognitionid"] == rekognition_id:
            employee_data = item
            break

    # =========================
    # EMPLOYEE NOT FOUND
    # =========================

    if not employee_data:

        return {
            "success": False,
            "message": "Employee data not found"
        }

    # =========================
    # SESSION VALIDITY
    # =========================

    session_valid_until = (
        datetime.now(IST) + timedelta(minutes=2)
    ).isoformat()

    # =========================
    # SAVE ATTENDANCE LOG
    # =========================

    attendance_table.put_item(
        Item={
            "logid": str(uuid.uuid4()),
            "rekognitionid": rekognition_id,
            "confidence": confidence,
            "status": "SUCCESS",
            "timestamp": current_time
        }
    )

    return {
        "success": True,
        "message": "Authentication successful",
        "employeeId": employee_data["employeeId"],
        "name": employee_data["name"],
        "department": employee_data["department"],
        "rekognitionid": rekognition_id,
        "confidence": confidence,
        "sessionValidUntil": session_valid_until
    }

# =========================
# GET EMPLOYEE PROFILE
# =========================

@app.get("/employee/{rekognition_id}")
def get_employee(rekognition_id: str):

    try:

        print("SEARCHING FOR:", rekognition_id)

        response = employees_table.scan()

        employee = None

        for item in response["Items"]:

            stored_id = str(
                item.get("rekognitionid", "")
            ).strip()

            incoming_id = str(
                rekognition_id
            ).strip()

            if stored_id == incoming_id:

                employee = item
                break

        if not employee:

            print("NO EMPLOYEE FOUND")

            return {
                "success": False,
                "message": "Employee not found"
            }

        attendance_response = attendance_table.scan()

        employee_logs = []

        for item in attendance_response["Items"]:

            if str(
                item.get("rekognitionid", "")
            ).strip() == incoming_id:

                # SAFE TIME FORMAT CONVERSION

                try:

                    raw_time = item.get(
                        "timestamp",
                        ""
                    )

                    parsed_time = datetime.strptime(
                        raw_time,
                        "%d/%m/%Y, %I:%M:%S %p"
                    )

                    item["formatted_time"] = parsed_time.strftime(
                        "%d-%m-%Y %I:%M:%S %p"
                    )

                except Exception as time_error:

                    print(
                        "TIME FORMAT ERROR:",
                        time_error
                    )

                    item["formatted_time"] = item.get(
                        "timestamp",
                        "N/A"
                    )

                employee_logs.append(item)

        employee_logs = sorted(
            employee_logs,
            key=lambda x: x["timestamp"],
            reverse=True
        )

        return {
            "success": True,
            "employee": employee,
            "logs": employee_logs
        }

    except Exception as e:

        print("Employee Profile Error:", e)

        return {
            "success": False,
            "message": str(e)
        }

# =========================
# RESET SYSTEM
# =========================

@app.delete("/reset-system")
def reset_system():

    employee_scan = employees_table.scan()

    for item in employee_scan["Items"]:

        employees_table.delete_item(
            Key={
                "employeeId": item["employeeId"]
            }
        )

    attendance_scan = attendance_table.scan()

    for item in attendance_scan["Items"]:

        attendance_table.delete_item(
            Key={
                "logid": item["logid"]
            }
        )

    # DELETE FACES FROM REKOGNITION

    faces = rekognition.list_faces(
        CollectionId=COLLECTION_ID
    )

    face_ids = [
        face["FaceId"]
        for face in faces["Faces"]
    ]

    if face_ids:

        rekognition.delete_faces(
            CollectionId=COLLECTION_ID,
            FaceIds=face_ids
        )

    return {
        "success": True,
        "message": "All cloud test data deleted successfully"
    }