from sqlalchemy import Column, Integer, String, Float, Date, Boolean, ForeignKey, DateTime, Text, Numeric
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import text
from .database import Base
import uuid

class Transaction(Base):
    __tablename__ = "transactions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    amount = Column(Numeric(10, 2), nullable=False)
    description = Column(Text)
    transaction_date = Column(Date, nullable=False)
    accounting_date = Column(Date, nullable=False)
    category_id = Column(UUID(as_uuid=True), ForeignKey("categories.id"), nullable=False)
    subcategory_id = Column(UUID(as_uuid=True), ForeignKey("subcategories.id"))
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    expense_type = Column(String, nullable=False)  # Assumes it's stored as a string
    is_income = Column(Boolean, default=False)
    split_ratio = Column(Numeric(5, 2), default=50.00)
    created_at = Column(DateTime, default=text("now()"))
    
    # Relationships
    category = relationship("Category", back_populates="transactions")
    subcategory = relationship("Subcategory", back_populates="transactions")
    refunds = relationship("Refund", back_populates="transaction")

class Category(Base):
    __tablename__ = "categories"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False)  # 'income', 'expense', or 'fixed_expense'
    
    # Relationships
    transactions = relationship("Transaction", back_populates="category")
    subcategories = relationship("Subcategory", back_populates="category")

class Subcategory(Base):
    __tablename__ = "subcategories"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    category_id = Column(UUID(as_uuid=True), ForeignKey("categories.id"), nullable=False)
    
    # Relationships
    category = relationship("Category", back_populates="subcategories")
    transactions = relationship("Transaction", back_populates="subcategory")

class Refund(Base):
    __tablename__ = "refunds"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    amount = Column(Numeric(10, 2), nullable=False)
    refund_date = Column(Date, nullable=False)
    description = Column(Text)
    transaction_id = Column(UUID(as_uuid=True), ForeignKey("transactions.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Relationships
    transaction = relationship("Transaction", back_populates="refunds")

class RecurringEvent(Base):
    """
    Nouvelle table pour stocker les événements récurrents pour les projections budgétaires
    """
    __tablename__ = "recurring_events"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    description = Column(String, nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    is_income = Column(Boolean, default=False)
    category_id = Column(UUID(as_uuid=True), ForeignKey("categories.id"), nullable=False)
    subcategory_id = Column(UUID(as_uuid=True), ForeignKey("subcategories.id"))
    frequency = Column(String, nullable=False)  # 'monthly', 'quarterly', 'yearly'
    start_date = Column(Date, nullable=False)
    end_date = Column(Date)  # Optionnel
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=text("now()"))
    active = Column(Boolean, default=True) 