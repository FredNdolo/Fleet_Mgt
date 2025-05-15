from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, WebSocket
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from datetime import timedelta, datetime, date
from passlib.context import CryptContext
from typing import Optional, List  # Added Optional import
import random
import os
from pathlib import Path
import logging
import subprocess

from database import SessionLocal, engine, Base
from models import User, UserActivity, Vehicle, Driver, DriverDocument, VehicleDocument, Cost, MaintenanceRecord
from schemas import (
    UserCreate, UserOut, UserActivityOut, VehicleCreate, VehicleOut, DriverCreate, DriverOut,
    DriverDocumentCreate, DriverDocumentOut, VehicleDocumentCreate, VehicleDocumentOut,
    CostCreate, CostOut, MaintenanceRecordCreate, MaintenanceRecordOut, RouteOptimizationOut
)
from utils import verify_password, create_access_token, SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES

# Configure logging
logging.basicConfig(
    filename='app.log',
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

app = FastAPI()

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create database tables
Base.metadata.create_all(bind=engine)

# Security setup
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# Database dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Log user activity
def log_activity(db: Session, user_id: int, action_type: str, details: str):
    activity = UserActivity(user_id=user_id, action_type=action_type, action_details=details)
    db.add(activity)
    db.commit()
    logging.info(f"User activity: {action_type} - {details}")

# Authenticate user
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = db.query(User).filter(User.username == username).first()
    if user is None or user.status != "active":
        raise credentials_exception
    return user

# Admin-only dependency
def get_admin_user(current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

# Manager or admin dependency
def get_manager_or_admin_user(current_user: User = Depends(get_current_user)):
    if current_user.role not in ["admin", "manager"]:
        raise HTTPException(status_code=403, detail="Manager or admin access required")
    return current_user

# --- User Endpoints ---
@app.post("/register", response_model=UserOut)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(
        (User.username == user.username) | (User.email == user.email)
    ).first()
    if existing_user:
        logging.error(f"Registration failed: Username {user.username} or email {user.email} already exists")
        raise HTTPException(status_code=400, detail="Username or email already registered")
    hashed_password = pwd_context.hash(user.password)
    new_user = User(
        username=user.username, email=user.email, password_hash=hashed_password,
        role=user.role, full_name=user.full_name, phone=user.phone,
        department=user.department, status=user.status
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    log_activity(db, new_user.id, "register", f"User {user.username} registered")
    return new_user

@app.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        logging.error(f"Login failed for username: {form_data.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username, "role": user.role}, expires_delta=access_token_expires
    )
    user.last_login = datetime.utcnow()
    db.commit()
    log_activity(db, user.id, "login", "User logged in")
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/me", response_model=UserOut)
def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

@app.get("/admin/users", response_model=List[UserOut])
def list_users(db: Session = Depends(get_db), admin_user: User = Depends(get_admin_user)):
    return db.query(User).all()

@app.post("/admin/users", response_model=UserOut)
def admin_create_user(user: UserCreate, db: Session = Depends(get_db), admin_user: User = Depends(get_admin_user)):
    existing_user = db.query(User).filter(
        (User.username == user.username) | (User.email == user.email)
    ).first()
    if existing_user:
        logging.error(f"User creation failed: Username {user.username} or email {user.email} already exists")
        raise HTTPException(status_code=400, detail="Username or email already registered")
    hashed_password = pwd_context.hash(user.password)
    new_user = User(
        username=user.username, email=user.email, password_hash=hashed_password,
        role=user.role, full_name=user.full_name, phone=user.phone,
        department=user.department, status=user.status
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    log_activity(db, admin_user.id, "add_user", f"Added user {user.username}")
    return new_user

@app.put("/admin/users/{user_id}", response_model=UserOut)
def update_user(user_id: int, user: UserCreate, db: Session = Depends(get_db), admin_user: User = Depends(get_admin_user)):
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        logging.error(f"User update failed: User ID {user_id} not found")
        raise HTTPException(status_code=404, detail="User not found")
    existing_user = db.query(User).filter(
        ((User.username == user.username) | (User.email == user.email)) & (User.id != user_id)
    ).first()
    if existing_user:
        logging.error(f"User update failed: Username {user.username} or email {user.email} already exists")
        raise HTTPException(status_code=400, detail="Username or email already registered")
    db_user.username = user.username
    db_user.email = user.email
    db_user.role = user.role
    db_user.full_name = user.full_name
    db_user.phone = user.phone
    db_user.department = user.department
    db_user.status = user.status
    if user.password:
        db_user.password_hash = pwd_context.hash(user.password)
    db.commit()
    db.refresh(db_user)
    log_activity(db, admin_user.id, "update_user", f"Updated user {user.username}")
    return db_user

@app.delete("/admin/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), admin_user: User = Depends(get_admin_user)):
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        logging.error(f"User deletion failed: User ID {user_id} not found")
        raise HTTPException(status_code=404, detail="User not found")
    if db_user.id == admin_user.id:
        logging.error(f"User deletion failed: Cannot delete self (User ID {user_id})")
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    db.delete(db_user)
    db.commit()
    log_activity(db, admin_user.id, "delete_user", f"Deleted user {db_user.username}")
    return {"message": "User deleted"}

@app.get("/admin/user-activity", response_model=List[UserActivityOut])
def get_user_activity(db: Session = Depends(get_db), admin_user: User = Depends(get_admin_user)):
    return db.query(UserActivity).all()

# --- Vehicle Endpoints ---
@app.post("/vehicles", response_model=VehicleOut)
def create_vehicle(vehicle: VehicleCreate, db: Session = Depends(get_db), current_user: User = Depends(get_manager_or_admin_user)):
    existing_vehicle = db.query(Vehicle).filter(Vehicle.registration_number == vehicle.registration_number).first()
    if existing_vehicle:
        logging.error(f"Vehicle creation failed: Registration number {vehicle.registration_number} already exists")
        raise HTTPException(status_code=400, detail="Vehicle registration number already exists")
    new_vehicle = Vehicle(**vehicle.dict())
    db.add(new_vehicle)
    db.commit()
    db.refresh(new_vehicle)
    log_activity(db, current_user.id, "add_vehicle", f"Added vehicle {vehicle.registration_number}")
    return new_vehicle

@app.get("/vehicles", response_model=List[VehicleOut])
def list_vehicles(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Vehicle).all()

@app.put("/vehicles/{vehicle_id}", response_model=VehicleOut)
def update_vehicle(vehicle_id: int, vehicle: VehicleCreate, db: Session = Depends(get_db), current_user: User = Depends(get_manager_or_admin_user)):
    db_vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not db_vehicle:
        logging.error(f"Vehicle update failed: Vehicle ID {vehicle_id} not found")
        raise HTTPException(status_code=404, detail="Vehicle not found")
    existing_vehicle = db.query(Vehicle).filter(Vehicle.registration_number == vehicle.registration_number, Vehicle.id != vehicle_id).first()
    if existing_vehicle:
        logging.error(f"Vehicle update failed: Registration number {vehicle.registration_number} already exists")
        raise HTTPException(status_code=400, detail="Vehicle registration number already exists")
    for key, value in vehicle.dict().items():
        setattr(db_vehicle, key, value)
    db.commit()
    db.refresh(db_vehicle)
    log_activity(db, current_user.id, "update_vehicle", f"Updated vehicle {vehicle.registration_number}")
    return db_vehicle

@app.delete("/vehicles/{vehicle_id}")
def delete_vehicle(vehicle_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_manager_or_admin_user)):
    db_vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not db_vehicle:
        logging.error(f"Vehicle deletion failed: Vehicle ID {vehicle_id} not found")
        raise HTTPException(status_code=404, detail="Vehicle not found")
    db.delete(db_vehicle)
    db.commit()
    log_activity(db, current_user.id, "delete_vehicle", f"Deleted vehicle {db_vehicle.registration_number}")
    return {"message": "Vehicle deleted"}

# --- Driver Endpoints ---
@app.post("/drivers", response_model=DriverOut)
def create_driver(driver: DriverCreate, db: Session = Depends(get_db), current_user: User = Depends(get_manager_or_admin_user)):
    existing_driver = db.query(Driver).filter(Driver.license_number == driver.license_number).first()
    if existing_driver:
        logging.error(f"Driver creation failed: License number {driver.license_number} already exists")
        raise HTTPException(status_code=400, detail="Driver license number already exists")
    new_driver = Driver(**driver.dict())
    db.add(new_driver)
    db.commit()
    db.refresh(new_driver)
    log_activity(db, current_user.id, "add_driver", f"Added driver {driver.name}")
    return new_driver

@app.get("/drivers", response_model=List[DriverOut])
def list_drivers(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Driver).all()

@app.put("/drivers/{driver_id}", response_model=DriverOut)
def update_driver(driver_id: int, driver: DriverCreate, db: Session = Depends(get_db), current_user: User = Depends(get_manager_or_admin_user)):
    db_driver = db.query(Driver).filter(Driver.id == driver_id).first()
    if not db_driver:
        logging.error(f"Driver update failed: Driver ID {driver_id} not found")
        raise HTTPException(status_code=404, detail="Driver not found")
    existing_driver = db.query(Driver).filter(Driver.license_number == driver.license_number, Driver.id != driver_id).first()
    if existing_driver:
        logging.error(f"Driver update failed: License number {driver.license_number} already exists")
        raise HTTPException(status_code=400, detail="Driver license number already exists")
    for key, value in driver.dict().items():
        setattr(db_driver, key, value)
    db.commit()
    db.refresh(db_driver)
    log_activity(db, current_user.id, "update_driver", f"Updated driver {driver.name}")
    return db_driver

@app.delete("/drivers/{driver_id}")
def delete_driver(driver_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_manager_or_admin_user)):
    db_driver = db.query(Driver).filter(Driver.id == driver_id).first()
    if not db_driver:
        logging.error(f"Driver deletion failed: Driver ID {driver_id} not found")
        raise HTTPException(status_code=404, detail="Driver not found")
    db.delete(db_driver)
    db.commit()
    log_activity(db, current_user.id, "delete_driver", f"Deleted driver {db_driver.name}")
    return {"message": "Driver deleted"}

# --- Document Endpoints ---
@app.post("/driver-documents", response_model=DriverDocumentOut)
async def upload_driver_document(
    driver_id: int,
    doc_type: str,
    doc_number: Optional[str] = None,
    issue_date: Optional[date] = None,
    expiry_date: Optional[date] = None,
    status: Optional[str] = None,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_manager_or_admin_user)
):
    driver = db.query(Driver).filter(Driver.id == driver_id).first()
    if not driver:
        logging.error(f"Driver document upload failed: Driver ID {driver_id} not found")
        raise HTTPException(status_code=404, detail="Driver not found")
    file_ext = file.filename.split(".")[-1]
    file_name = f"driver_doc_{driver_id}_{datetime.now().strftime('%Y%m%d%H%M%S')}.{file_ext}"
    save_path = Path("documents") / file_name
    save_path.parent.mkdir(exist_ok=True)
    with open(save_path, "wb") as f:
        f.write(await file.read())
    document = DriverDocument(
        driver_id=driver_id, doc_type=doc_type, doc_number=doc_number,
        issue_date=issue_date, expiry_date=expiry_date, status=status,
        file_path=str(save_path)
    )
    db.add(document)
    db.commit()
    db.refresh(document)
    log_activity(db, current_user.id, "upload_driver_doc", f"Uploaded {doc_type} for driver {driver_id}")
    return document

@app.get("/driver-documents/{driver_id}", response_model=List[DriverDocumentOut])
def list_driver_documents(driver_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    driver = db.query(Driver).filter(Driver.id == driver_id).first()
    if not driver:
        logging.error(f"Driver document fetch failed: Driver ID {driver_id} not found")
        raise HTTPException(status_code=404, detail="Driver not found")
    return db.query(DriverDocument).filter(DriverDocument.driver_id == driver_id).all()

@app.post("/vehicle-documents", response_model=VehicleDocumentOut)
async def upload_vehicle_document(
    vehicle_id: int,
    doc_type: str,
    doc_number: Optional[str] = None,
    issue_date: Optional[date] = None,
    expiry_date: Optional[date] = None,
    status: Optional[str] = None,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_manager_or_admin_user)
):
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        logging.error(f"Vehicle document upload failed: Vehicle ID {vehicle_id} not found")
        raise HTTPException(status_code=404, detail="Vehicle not found")
    file_ext = file.filename.split(".")[-1]
    file_name = f"vehicle_doc_{vehicle_id}_{datetime.now().strftime('%Y%m%d%H%M%S')}.{file_ext}"
    save_path = Path("documents") / file_name
    save_path.parent.mkdir(exist_ok=True)
    with open(save_path, "wb") as f:
        f.write(await file.read())
    document = VehicleDocument(
        vehicle_id=vehicle_id, doc_type=doc_type, doc_number=doc_number,
        issue_date=issue_date, expiry_date=expiry_date, status=status,
        file_path=str(save_path)
    )
    db.add(document)
    db.commit()
    db.refresh(document)
    log_activity(db, current_user.id, "upload_vehicle_doc", f"Uploaded {doc_type} for vehicle {vehicle_id}")
    return document

@app.get("/vehicle-documents/{vehicle_id}", response_model=List[VehicleDocumentOut])
def list_vehicle_documents(vehicle_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        logging.error(f"Vehicle document fetch failed: Vehicle ID {vehicle_id} not found")
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return db.query(VehicleDocument).filter(VehicleDocument.vehicle_id == vehicle_id).all()

# --- Cost Endpoints ---
@app.post("/costs", response_model=CostOut)
async def create_cost(
    cost: CostCreate,
    receipt: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_manager_or_admin_user)
):
    receipt_path = None
    if receipt:
        file_ext = receipt.filename.split(".")[-1]
        file_name = f"receipt_{datetime.now().strftime('%Y%m%d%H%M%S')}.{file_ext}"
        save_path = Path("receipts") / file_name
        save_path.parent.mkdir(exist_ok=True)
        with open(save_path, "wb") as f:
            f.write(await receipt.read())
        receipt_path = str(save_path)
    new_cost = Cost(**cost.dict(), receipt_path=receipt_path)
    db.add(new_cost)
    db.commit()
    db.refresh(new_cost)
    log_activity(db, current_user.id, "add_cost", f"Added {cost.category} cost of {cost.amount}")
    return new_cost

@app.get("/costs", response_model=List[CostOut])
def list_costs(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Cost).all()

# --- Maintenance Endpoints ---
@app.post("/maintenance-records", response_model=MaintenanceRecordOut)
def create_maintenance_record(
    record: MaintenanceRecordCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_manager_or_admin_user)
):
    vehicle = db.query(Vehicle).filter(Vehicle.id == record.vehicle_id).first()
    if not vehicle:
        logging.error(f"Maintenance record creation failed: Vehicle ID {record.vehicle_id} not found")
        raise HTTPException(status_code=404, detail="Vehicle not found")
    new_record = MaintenanceRecord(**record.dict())
    db.add(new_record)
    db.commit()
    db.refresh(new_record)
    if record.status == "Completed":
        vehicle.last_maintenance = record.date
        vehicle.maintenance_score = 100
        db.commit()
    log_activity(db, current_user.id, "schedule_maintenance", f"Scheduled {record.maintenance_type} for vehicle {record.vehicle_id}")
    return new_record

@app.get("/maintenance-records", response_model=List[MaintenanceRecordOut])
def list_maintenance_records(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(MaintenanceRecord).all()

# --- Route Optimization ---
@app.post("/optimize-route", response_model=RouteOptimizationOut)
def optimize_route(vehicle_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        logging.error(f"Route optimization failed: Vehicle ID {vehicle_id} not found")
        raise HTTPException(status_code=404, detail="Vehicle not found")
    fuel_saved = random.uniform(15, 20)
    time_saved = random.uniform(15, 20)
    carbon_reduction = fuel_saved * 2.68 * vehicle.fuel_level if vehicle.fuel_level else 0
    log_activity(db, current_user.id, "optimize_route", f"Optimized route for vehicle {vehicle_id}")
    return {
        "vehicle_id": vehicle_id,
        "fuel_saved_percent": fuel_saved,
        "time_saved_percent": time_saved,
        "carbon_reduction": carbon_reduction
    }

# --- Simulated Updates ---
@app.get("/simulated-updates")
def get_simulated_updates(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    vehicles = db.query(Vehicle).all()
    drivers = db.query(Driver).all()
    for vehicle in vehicles:
        vehicle.latitude = (vehicle.latitude or -1.2921) + random.uniform(-0.01, 0.01)
        vehicle.longitude = (vehicle.longitude or 36.8219) + random.uniform(-0.01, 0.01)
        vehicle.status = random.choice(["Active", "Idle", "Maintenance"])
        vehicle.speed = random.uniform(0, 80) if vehicle.status == "Active" else 0
        vehicle.fuel_level = max(0, vehicle.fuel_level - random.uniform(0, 0.5))
        vehicle.maintenance_score = max(0, vehicle.maintenance_score - random.uniform(0, 0.2))
    for driver in drivers:
        driver.status = random.choice(["Available", "On Trip", "Off Duty"])
        if driver.status == "On Trip":
            driver.total_trips += 1
            driver.rating = min(5.0, driver.rating + random.uniform(0, 0.1))
    db.commit()
    log_activity(db, current_user.id, "simulate_updates", "Fetched simulated vehicle and driver updates")
    return {
        "vehicles": [VehicleOut.from_orm(v) for v in vehicles],
        "drivers": [DriverOut.from_orm(d) for d in drivers]
    }

# --- WebSocket Placeholder ---
@app.websocket("/ws/updates")
async def websocket_updates(websocket: WebSocket, db: Session = Depends(get_db)):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_json()
            vehicle_id = data.get('vehicle_id')
            vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
            if vehicle:
                vehicle.latitude = data.get('latitude', vehicle.latitude)
                vehicle.longitude = data.get('longitude', vehicle.longitude)
                vehicle.speed = data.get('speed', vehicle.speed)
                vehicle.fuel_level = data.get('fuel_level', vehicle.fuel_level)
                db.commit()
                await websocket.send_json({"status": "updated", "vehicle_id": vehicle_id})
    except Exception as e:
        await websocket.close()
        logging.error(f"WebSocket error: {e}")

# --- Backup/Restore ---
@app.post("/backup")
def create_backup(db: Session = Depends(get_db), admin_user: User = Depends(get_admin_user)):
    backup_time = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_file = f"backup/logistics_backup_{backup_time}.sql"
    os.makedirs("backup", exist_ok=True)
    try:
        subprocess.run([
            "pg_dump", "-U", "postgres", "-h", "localhost", "-f", backup_file, "logistics_saas"
        ], check=True, env={**os.environ, "PGPASSWORD": "password"})
        log_activity(db, admin_user.id, "backup", f"Created backup: {backup_file}")
        return {"message": f"Backup created: {backup_file}"}
    except subprocess.CalledProcessError as e:
        logging.error(f"Backup failed: {e}")
        raise HTTPException(status_code=500, detail=f"Backup failed: {e}")

@app.post("/restore")
async def restore_backup(file: UploadFile = File(...), db: Session = Depends(get_db), admin_user: User = Depends(get_admin_user)):
    backup_path = f"backup/restore_{datetime.now().strftime('%Y%m%d_%H%M%S')}.sql"
    os.makedirs("backup", exist_ok=True)
    with open(backup_path, "wb") as f:
        f.write(await file.read())
    try:
        subprocess.run([
            "psql", "-U", "postgres", "-h", "localhost", "-d", "logistics_saas", "-f", backup_path
        ], check=True, env={**os.environ, "PGPASSWORD": "password"})
        log_activity(db, admin_user.id, "restore", f"Restored database from: {backup_path}")
        return {"message": "Database restored successfully"}
    except subprocess.CalledProcessError as e:
        logging.error(f"Restore failed: {e}")
        raise HTTPException(status_code=500, detail=f"Restore failed: {e}")

# --- Seed Data ---
@app.post("/seed-data")
def seed_data(db: Session = Depends(get_db)):
    if db.query(Vehicle).count() == 0:
        vehicles = [
            Vehicle(registration_number='KBZ123Y', vehicle_type='Truck', capacity=10000, fuel_type='Diesel', status='Active', last_maintenance=date(2024, 1, 1), latitude=-1.2921, longitude=36.8219, speed=60, fuel_level=75, maintenance_score=90),
            Vehicle(registration_number='KCF456X', vehicle_type='Van', capacity=5000, fuel_type='Diesel', status='Active', last_maintenance=date(2024, 1, 1), latitude=-1.3021, longitude=36.8119, speed=55, fuel_level=80, maintenance_score=85),
            Vehicle(registration_number='KDG789W', vehicle_type='Truck', capacity=15000, fuel_type='Diesel', status='Maintenance', last_maintenance=date(2024, 1, 1), latitude=-1.2821, longitude=36.8319, speed=0, fuel_level=45, maintenance_score=40),
        ]
        db.add_all(vehicles)
    if db.query(Driver).count() == 0:
        drivers = [
            Driver(name='John Doe', license_number='DL12345', license_expiry=date(2026, 1, 1), phone='0712345678', email='john@example.com', status='Active', join_date=date(2023, 1, 1), rest_hours=8.0, total_trips=120, rating=4.5, notes='Experienced driver'),
            Driver(name='Jane Smith', license_number='DL67890', license_expiry=date(2025, 6, 15), phone='0723456789', email='jane@example.com', status='Active', join_date=date(2023, 3, 15), rest_hours=8.0, total_trips=85, rating=4.7, notes='Safe driver'),
            Driver(name='Bob Johnson', license_number='DL54321', license_expiry=date(2024, 12, 10), phone='0734567890', email='bob@example.com', status='On Leave', join_date=date(2023, 6, 1), rest_hours=0.0, total_trips=65, rating=4.2, notes='New driver'),
        ]
        db.add_all(drivers)
    if db.query(User).filter(User.username == 'admin').count() == 0:
        admin = User(
            username='admin',
            email='admin@logistics.com',
            password_hash=pwd_context.hash('admin123'),
            role='admin',
            full_name='System Administrator',
            department='IT',
            status='active'
        )
        db.add(admin)
    db.commit()
    log_activity(db, 0, "seed_data", "Database seeded with sample data")
    return {"message": "Database seeded"}

@app.get("/")
def read_root():
    return {"message": "Welcome to the HC Logistics SaaS!"}