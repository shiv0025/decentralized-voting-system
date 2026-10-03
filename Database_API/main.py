  # Import required modules
import dotenv
import os
import mysql.connector
from fastapi import FastAPI, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.encoders import jsonable_encoder
from mysql.connector import errorcode
import jwt

# Loading the environment variables
dotenv.load_dotenv()

# Initialize the todoapi app
app = FastAPI()

# Define the allowed origins for CORS
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

pass

MOCK_DB = {
    "admin": {"password": "admin", "role": "admin"},
    "user1": {"password": "user1", "role": "user"}
}

# Define the authentication middleware
async def authenticate(request: Request):
    api_key = request.headers.get('authorization')
    if api_key:
        api_key = api_key.replace("Bearer ", "")
    # For mock testing, we just check if it's in our mock db or if it's during login step where api_key might be the voter_id itself
    if not api_key or api_key not in MOCK_DB:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Forbidden"
        )
    return True

# Define the POST endpoint for login
@app.get("/login")
async def login(request: Request, voter_id: str, password: str):
    role = await get_role(voter_id, password)

    # Assuming authentication is successful, generate a token
    token = jwt.encode({'password': password, 'voter_id': voter_id, 'role': role}, os.environ.get('SECRET_KEY', 'default_secret'), algorithm='HS256')

    return {'token': token, 'role': role}

async def get_role(voter_id, password):
    user = MOCK_DB.get(voter_id)
    if user and user["password"] == password:
        return user["role"]
        
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid voter id or password"
    )
