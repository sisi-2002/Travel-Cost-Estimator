from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # MongoDB Configuration
    mongodb_uri: str
    database_name: str = "tripcraft"
    
    # JWT Configuration
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # Server Configuration
    host: str = "0.0.0.0"
    port: int = 8005
    debug: bool = True

    # Add Amadeus config
    amadeus_client_id: str
    amadeus_client_secret: str
    amadeus_hostname: str = "test.api.amadeus.com"
    
    class Config:
        env_file = ".env"
        case_sensitive = False


    


# Create settings instance
settings = Settings()
