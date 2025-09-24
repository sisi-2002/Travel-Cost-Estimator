from pymongo.collection import Collection
from bson import ObjectId
from passlib.context import CryptContext
from datetime import datetime, timedelta
from pydantic import BaseModel
from typing import Optional, Dict, Any
from models import UserCreate, UserUpdate
from database import db_manager
import logging


logger = logging.getLogger(__name__)


# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class UserCRUD:
    def __init__(self):
        self.collection_name = "users"
    
    def get_collection(self) -> Collection:
        """Get users collection"""
        if db_manager.database is None:
            raise Exception("Database not connected")
        return db_manager.get_collection(self.collection_name)
    
    def _format_user_response(self, user_doc: Dict[str, Any]) -> Dict[str, Any]:
        """Convert MongoDB document to response format"""
        if not user_doc:
            return None
        
        # Convert ObjectId to string and rename _id to id
        user_doc["id"] = str(user_doc["_id"])
        del user_doc["_id"]
        
        # Remove password from response
        if "password" in user_doc:
            del user_doc["password"]
        
        return user_doc
    
    def hash_password(self, password: str) -> str:
        """Hash a password"""
        return pwd_context.hash(password)
    
    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify a password against its hash"""
        return pwd_context.verify(plain_password, hashed_password)
    
    async def create_user(self, user: UserCreate) -> Dict[str, Any]:
        """Create a new user"""
        try:
            collection = self.get_collection()
            
            # Check if user already exists
            existing_user = collection.find_one({"email": user.email})
            if existing_user:
                raise ValueError("User with this email already exists")
            
            # Hash the password
            hashed_password = self.hash_password(user.password)
            
            # Prepare user document
            user_doc = {
                "email": user.email,
                "full_name": user.full_name,
                "phone": user.phone,
                "password": hashed_password,
                "is_active": True,
                "subscription_type": "basic",
                "subscription_expiry": None,
                "last_plan_date": None,
                "plans_today": 0,
                "payment_details": [],  # List to store payment history
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            
            # Insert user
            result = collection.insert_one(user_doc)
            
            # Retrieve the created user
            created_user = collection.find_one({"_id": result.inserted_id})
            
            return self._format_user_response(created_user)
            
        except ValueError:
            raise
        except Exception as e:
            logger.error(f"Error creating user: {e}")
            raise Exception(f"Failed to create user: {str(e)}")
    
    async def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """Get user by email"""
        try:
            collection = self.get_collection()
            user = collection.find_one({"email": email})
            return self._format_user_response(user) if user else None
        except Exception as e:
            logger.error(f"Error getting user by email: {e}")
            return None
    
    async def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user by ID"""
        try:
            collection = self.get_collection()
            user = collection.find_one({"_id": ObjectId(user_id)})
            return self._format_user_response(user) if user else None
        except Exception as e:
            logger.error(f"Error getting user by ID: {e}")
            return None
        
    async def authenticate_user(self, email: str, password: str) -> Optional[Dict[str, Any]]:
        """Authenticate user with email and password"""
        try:
            collection = self.get_collection()
            user = collection.find_one({"email": email})
            
            if not user:
                return None
            
            if not self.verify_password(password, user["password"]):
                return None
            
            if not user.get("is_active", False):
                return None
            
            return self._format_user_response(user)
            
        except Exception as e:
            logger.error(f"Error authenticating user: {e}")
            return None
    
    async def update_user(self, user_id: str, user_update: UserUpdate) -> Optional[Dict[str, Any]]:
        """Update user profile"""
        try:
            collection = self.get_collection()
            
            # Prepare update data
            update_data = {}
            if user_update.full_name is not None:
                update_data["full_name"] = user_update.full_name
            if user_update.phone is not None:
                update_data["phone"] = user_update.phone
            
            if not update_data:
                # No fields to update, return current user
                return await self.get_user_by_id(user_id)
            
            update_data["updated_at"] = datetime.utcnow()
            
            # Update user
            result = collection.update_one(
                {"_id": ObjectId(user_id)},
                {"$set": update_data}
            )
            
            if result.matched_count == 0:
                return None
            
            # Return updated user
            return await self.get_user_by_id(user_id)
            
        except Exception as e:
            logger.error(f"Error updating user: {e}")
            return None
    
    async def change_password(self, user_id: str, current_password: str, new_password: str) -> bool:
        """Change user password"""
        try:
            collection = self.get_collection()
            
            # Get user with password
            user = collection.find_one({"_id": ObjectId(user_id)})
            if not user:
                return False
            
            # Verify current password
            if not self.verify_password(current_password, user["password"]):
                return False
            
            # Hash new password
            new_hashed_password = self.hash_password(new_password)
            
            # Update password
            result = collection.update_one(
                {"_id": ObjectId(user_id)},
                {
                    "$set": {
                        "password": new_hashed_password,
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            
            return result.matched_count > 0
            
        except Exception as e:
            logger.error(f"Error changing password: {e}")
            return False
    
    async def deactivate_user(self, user_id: str) -> bool:
        """Deactivate user account"""
        try:
            collection = self.get_collection()
            
            result = collection.update_one(
                {"_id": ObjectId(user_id)},
                {
                    "$set": {
                        "is_active": False,
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            
            return result.matched_count > 0
            
        except Exception as e:
            logger.error(f"Error deactivating user: {e}")
            return False
    async def check_can_generate_plan(self, user_id: str) -> bool:
        """Check if user can generate a plan based on subscription and limits"""
        try:
            collection = self.get_collection()
            user = collection.find_one({"_id": ObjectId(user_id)})
            if not user:
                return False

            now = datetime.utcnow()
            subscription_type = user.get("subscription_type", "basic")
            subscription_expiry = user.get("subscription_expiry")

            # Check if premium and not expired
            if subscription_type == "premium":
                if subscription_expiry and subscription_expiry > now:
                    return True
                else:
                    # Expire premium
                    collection.update_one(
                        {"_id": ObjectId(user_id)},
                        {"$set": {"subscription_type": "basic", "subscription_expiry": None}}
                    )
                    subscription_type = "basic"

            # For basic, check daily limit
            if subscription_type == "basic":
                last_plan_date = user.get("last_plan_date")
                plans_today = user.get("plans_today", 0)
                today = now.date()

                if last_plan_date and last_plan_date.date() != today:
                    # Reset count
                    collection.update_one(
                        {"_id": ObjectId(user_id)},
                        {"$set": {"plans_today": 0, "last_plan_date": now}}
                    )
                    plans_today = 0 

                return plans_today < 1

            return False

        except Exception as e:
            logger.error(f"Error checking plan generation: {e}")
            return False

    async def update_plan_generation(self, user_id: str):
        """Update plan generation count after successful generation"""
        try:
            collection = self.get_collection()
            user = collection.find_one({"_id": ObjectId(user_id)})
            if not user:
                return

            now = datetime.utcnow()
            subscription_type = user.get("subscription_type", "basic")

            if subscription_type == "basic":
                collection.update_one(
                    {"_id": ObjectId(user_id)},
                    {
                        "$set": {"last_plan_date": now},
                        "$inc": {"plans_today": 1}
                    }
                )

        except Exception as e:
            logger.error(f"Error updating plan generation: {e}")

    async def upgrade_to_premium(self, user_id: str, payment_detail: dict):
        """Upgrade user to premium for 30 days and store payment detail"""
        try:
            collection = self.get_collection()
            now = datetime.utcnow()
            expiry = now + timedelta(days=30)

            collection.update_one(
                {"_id": ObjectId(user_id)},
                {
                    "$set": {
                        "subscription_type": "premium",
                        "subscription_expiry": expiry,
                        "updated_at": now
                    },
                    "$push": {"payment_details": payment_detail}
                }
            )

        except Exception as e:
            logger.error(f"Error upgrading to premium: {e}")

# Create global instance
user_crud = UserCRUD()
