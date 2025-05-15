from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime

class UserBase(BaseModel):
    username: str
    email: str
    full_name: Optional[str] = None
    phone: Optional[str] = None
    department: Optional[str] = None
    role: str
    status: str = "active"

class UserCreate(UserBase):
    password: str

class UserOut(UserBase):
    id: int
    last_login: Optional[datetime] = None
    created_at: datetime
    class Config:
        from_attributes = True

class UserActivityOut(BaseModel):
    activity_id: int
    user_id: int
    action_type: str
    action_details: Optional[str]
    timestamp: datetime
    class Config:
        from_attributes = True

class VehicleBase(BaseModel):
    registration_number: str
    vehicle_type: str
    capacity: Optional[float] = None
    fuel_type: Optional[str] = None
    status: Optional[str] = None
    last_maintenance: Optional[date] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    speed: Optional[float] = 0
    fuel_level: Optional[float] = 100
    maintenance_score: Optional[float] = 100
    driver_id: Optional[int] = None

class VehicleCreate(VehicleBase):
    pass

class VehicleOut(VehicleBase):
    id: int
    class Config:
        from_attributes = True

class DriverBase(BaseModel):
    name: str
    license_number: str
    license_expiry: Optional[date] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    status: Optional[str] = None
    join_date: Optional[date] = None
    rest_hours: Optional[float] = 8.0
    last_duty_end: Optional[datetime] = None
    total_trips: Optional[int] = 0
    rating: Optional[float] = 0.0
    notes: Optional[str] = None

class DriverCreate(DriverBase):
    pass

class DriverOut(DriverBase):
    id: int
    class Config:
        from_attributes = True

class DriverDocumentBase(BaseModel):
    doc_type: str
    doc_number: Optional[str] = None
    issue_date: Optional[date] = None
    expiry_date: Optional[date] = None
    status: Optional[str] = None
    file_path: Optional[str] = None

class DriverDocumentCreate(DriverDocumentBase):
    pass

class DriverDocumentOut(DriverDocumentBase):
    doc_id: int
    driver_id: int
    class Config:
        from_attributes = True

class VehicleDocumentBase(BaseModel):
    doc_type: str
    doc_number: Optional[str] = None
    issue_date: Optional[date] = None
    expiry_date: Optional[date] = None
    status: Optional[str] = None
    file_path: Optional[str] = None

class VehicleDocumentCreate(VehicleDocumentBase):
    pass

class VehicleDocumentOut(VehicleDocumentBase):
    doc_id: int
    vehicle_id: int
    class Config:
        from_attributes = True

class CostBase(BaseModel):
    date: date
    category: str
    amount: float
    description: Optional[str] = None
    vehicle_id: Optional[int] = None
    driver_id: Optional[int] = None
    receipt_path: Optional[str] = None
    status: Optional[str] = None

class CostCreate(CostBase):
    pass

class CostOut(CostBase):
    cost_id: int
    created_at: datetime
    class Config:
        from_attributes = True

class MaintenanceRecordBase(BaseModel):
    vehicle_id: int
    maintenance_type: str
    date: date
    cost: Optional[float] = None
    notes: Optional[str] = None
    next_maintenance_date: Optional[date] = None
    status: Optional[str] = None

class MaintenanceRecordCreate(MaintenanceRecordBase):
    pass

class MaintenanceRecordOut(MaintenanceRecordBase):
    record_id: int
    class Config:
        from_attributes = True

class RouteOptimizationOut(BaseModel):
    vehicle_id: int
    fuel_saved_percent: float
    time_saved_percent: float
    carbon_reduction: Optional[float] = None