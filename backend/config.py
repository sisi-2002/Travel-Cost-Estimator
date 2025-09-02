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


    # Grok API Configuration
    grok_api_key: str
    grok_api_url: str
    # Optional: Groq model name (to avoid extra field errors if present in .env)
    groq_model: Optional[str] = None
    # Optional: Live FX rates endpoint (e.g., https://api.exchangerate.host/convert)
    fx_api_url: Optional[str] = None
    
    
    class Config:
        env_file = ".env"
        case_sensitive = False


    


# Create settings instance
settings = Settings()
