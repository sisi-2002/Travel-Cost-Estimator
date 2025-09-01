from pymongo import MongoClient
from pymongo.database import Database
from pymongo.collection import Collection
from config import settings
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DatabaseManager:
    def __init__(self):
        self.client: MongoClient = None
        self.database: Database = None
        
    async def connect(self):
        """Connect to MongoDB Atlas"""
        try:
            self.client = MongoClient(settings.mongodb_uri)
            # Test the connection
            self.client.admin.command('ping')
            self.database = self.client[settings.database_name]
            logger.info("Successfully connected to MongoDB Atlas")
        except Exception as e:
            logger.error(f"Failed to connect to MongoDB: {e}")
            raise e
    
    async def close(self):
        """Close MongoDB connection"""
        if self.client:
            self.client.close()
            logger.info("MongoDB connection closed")
    
    def get_collection(self, collection_name: str) -> Collection:
        """Get a collection from the database"""
        if self.database is None:
            raise Exception("Database not connected")
        return self.database[collection_name]

# Create global database manager instance
db_manager = DatabaseManager()

# These functions are kept for backward compatibility but now work synchronously
async def get_database() -> Database:
    """Get database instance"""
    return db_manager.database

async def get_collection(collection_name: str) -> Collection:
    """Get collection instance"""
    return db_manager.get_collection(collection_name)


