from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, nullable=False)  # admin, manager, user
    full_name = Column(String)
    phone = Column(String)
    department = Column(String)
    status = Column(String, default="active")
    last_login = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    activities = relationship("UserActivity", back_populates="user")

class UserActivity(Base):
    __tablename__ = "user_activity"
    activity_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    action_type = Column(String, nullable=False)
    action_details = Column(Text)
    timestamp = Column(DateTime, default=datetime.utcnow)
    user = relationship("User", back_populates="activities")

class Vehicle(Base):
    __tablename__ = "vehicles"
    id = Column(Integer, primary_key=True, index=True)
    registration_number = Column(String, unique=True, nullable=False)
    vehicle_type = Column(String, nullable=False)  # Truck, Van, etc.
    capacity = Column(Float)
    fuel_type = Column(String)  # Diesel, Petrol, etc.
    status = Column(String)
    last_maintenance = Column(Date)
    latitude = Column(Float)
    longitude = Column(Float)
    speed = Column(Float, default=0)
    fuel_level = Column(Float, default=100)
    maintenance_score = Column(Float, default=100)
    driver_id = Column(Integer, ForeignKey("drivers.id"))
    driver = relationship("Driver", back_populates="vehicles")
    documents = relationship("VehicleDocument", back_populates="vehicle")
    costs = relationship("Cost", back_populates="vehicle")
    maintenance_records = relationship("MaintenanceRecord", back_populates="vehicle")

class Driver(Base):
    __tablename__ = "drivers"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    license_number = Column(String, unique=True, nullable=False)
    license_expiry = Column(Date)
    phone = Column(String)
    email = Column(String)
    status = Column(String)
    join_date = Column(Date)
    rest_hours = Column(Float, default=8.0)
    last_duty_end = Column(DateTime)
    total_trips = Column(Integer, default=0)
    rating = Column(Float, default=0.0)
    notes = Column(Text)
    vehicles = relationship("Vehicle", back_populates="driver")
    documents = relationship("DriverDocument", back_populates="driver")
    costs = relationship("Cost", back_populates="driver")

class DriverDocument(Base):
    __tablename__ = "driver_documents"
    doc_id = Column(Integer, primary_key=True, index=True)
    driver_id = Column(Integer, ForeignKey("drivers.id"))
    doc_type = Column(String, nullable=False)
    doc_number = Column(String)
    issue_date = Column(Date)
    expiry_date = Column(Date)
    status = Column(String)
    file_path = Column(String)
    driver = relationship("Driver", back_populates="documents")

class VehicleDocument(Base):
    __tablename__ = "vehicle_documents"
    doc_id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"))
    doc_type = Column(String, nullable=False)
    doc_number = Column(String)
    issue_date = Column(Date)
    expiry_date = Column(Date)
    status = Column(String)
    file_path = Column(String)
    vehicle = relationship("Vehicle", back_populates="documents")

class Cost(Base):
    __tablename__ = "costs"
    cost_id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False)
    category = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    description = Column(Text)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"))
    driver_id = Column(Integer, ForeignKey("drivers.id"))
    receipt_path = Column(String)
    status = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    vehicle = relationship("Vehicle", back_populates="costs")
    driver = relationship("Driver", back_populates="costs")

class MaintenanceRecord(Base):
    __tablename__ = "maintenance_records"
    record_id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"))
    maintenance_type = Column(String, nullable=False)
    date = Column(Date, nullable=False)
    cost = Column(Float)
    notes = Column(Text)
    next_maintenance_date = Column(Date)
    status = Column(String)
    vehicle = relationship("Vehicle", back_populates="maintenance_records")