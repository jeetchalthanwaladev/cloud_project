import logging
import os
import uuid
from datetime import datetime, timezone
from typing import Optional

import boto3
from boto3.dynamodb.conditions import Attr
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# -------------------------
# APP CONFIG
# -------------------------
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Learning Platform API")

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*").split(",")
AWS_REGION = os.getenv("AWS_REGION", "eu-north-1")
TABLE_NAME = os.getenv("DYNAMO_TABLE", "Courses")
USERS_TABLE_NAME = os.getenv("USERS_TABLE", "Users")

# -------------------------
# CORS
# -------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------
# DYNAMODB
# -------------------------
dynamodb = boto3.resource("dynamodb", region_name=AWS_REGION)
table = dynamodb.Table(TABLE_NAME)
users_table = dynamodb.Table(USERS_TABLE_NAME)

# -------------------------
# MODELS
# -------------------------
class CourseCreate(BaseModel):
    title: str
    video_url: str
    created_by: str


class CourseUpdate(BaseModel):
    title: Optional[str] = None
    video_url: Optional[str] = None


class UserSignup(BaseModel):
    name: str
    email: str
    password: str
    role: str


class UserLogin(BaseModel):
    email: str
    password: str


# -------------------------
# ROUTES
# -------------------------
@app.get("/")
def home():
    return {"message": "Backend running 🚀"}


@app.post("/signup")
def signup(user: UserSignup):
    try:
        response = users_table.get_item(Key={"email": user.email})

        if "Item" in response:
            raise HTTPException(status_code=400, detail="User already exists")

        # 🔥 STORE PASSWORD DIRECTLY (NO HASHING)
        item = {
            "email": user.email,
            "name": user.name,
            "password": user.password,
            "role": user.role,
            "created_at": datetime.now(timezone.utc).isoformat()
        }

        users_table.put_item(Item=item)

        return {"message": "Account created successfully"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/login")
def login(user: UserLogin):
    try:
        response = users_table.get_item(Key={"email": user.email})

        if "Item" not in response:
            raise HTTPException(status_code=404, detail="User not found")

        db_user = response["Item"]

        # 🔥 DIRECT PASSWORD CHECK
        if user.password != db_user["password"]:
            raise HTTPException(status_code=401, detail="Invalid credentials")

        return {
            "message": "Login successful",
            "user": {
                "email": db_user["email"],
                "name": db_user.get("name", ""),
                "role": db_user.get("role", "student")
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/courses")
def get_courses(created_by: Optional[str] = Query(None)):
    try:
        if created_by:
            response = table.scan(
                FilterExpression=Attr("created_by").eq(created_by)
            )
        else:
            response = table.scan()

        return response.get("Items", [])

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/courses")
def add_course(course: CourseCreate):
    item = {
        "id": str(uuid.uuid4()),
        "title": course.title,
        "video_url": course.video_url,
        "created_by": course.created_by,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    try:
        table.put_item(Item=item)
        return {"message": "Course added successfully", "course": item}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/courses/{course_id}")
def update_course(course_id: str, course_update: CourseUpdate):
    update_parts = []
    expr_values = {}
    expr_names = {}

    if course_update.title is not None:
        update_parts.append("#t = :t")
        expr_values[":t"] = course_update.title
        expr_names["#t"] = "title"

    if course_update.video_url is not None:
        update_parts.append("video_url = :v")
        expr_values[":v"] = course_update.video_url

    if not update_parts:
        raise HTTPException(status_code=400, detail="No fields to update")

    try:
        response = table.update_item(
            Key={"id": course_id},
            UpdateExpression="SET " + ", ".join(update_parts),
            ExpressionAttributeValues=expr_values,
            ExpressionAttributeNames=expr_names if expr_names else None,
            ReturnValues="ALL_NEW",
            ConditionExpression=Attr("id").exists(),
        )

        return {
            "message": "Course updated successfully",
            "course": response["Attributes"]
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/courses/{course_id}")
def delete_course(course_id: str):
    try:
        response = table.delete_item(
            Key={"id": course_id},
            ReturnValues="ALL_OLD",
        )

        if "Attributes" not in response:
            raise HTTPException(status_code=404, detail="Course not found")

        return {"message": "Course deleted successfully"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))