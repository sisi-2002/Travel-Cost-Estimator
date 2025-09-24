from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional


class Settings(BaseSettings):
    model_config = SettingsConfigDict(extra='ignore', env_file='.env', case_sensitive=False)
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


    #STRIPE Configuration
    stripe_secret_key: str
    stripe_publishable_key: str
    premium_priceid: str
    web_hook_secret: str
    
    
    # Remove legacy Config; settings configured via model_config


    


# Create settings instance
settings = Settings()
