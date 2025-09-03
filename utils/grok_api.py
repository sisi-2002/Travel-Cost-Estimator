import os
import requests
from dotenv import load_dotenv
import logging

# Load environment variables
load_dotenv()

# Configure logging
logger = logging.getLogger(__name__)

GROK_API_KEY = os.getenv("GROK_API_KEY")
GROK_API_URL = os.getenv("GROK_API_URL")

def ask_grok(query: str, system_role: str = "You are a helpful travel assistant.") -> str:
    """
    Send a query to the Grok API and return the response
    
    Args:
        query (str): The user query to send to the API
        system_role (str): The system role/prompt for the AI
        
    Returns:
        str: The AI response or error message
    """
    if not GROK_API_KEY or not GROK_API_URL:
        error_msg = "GROK_API_KEY and GROK_API_URL must be set in environment variables"
        logger.error(error_msg)
        raise ValueError(error_msg)
    
    headers = {
        "Authorization": f"Bearer {GROK_API_KEY}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": "meta-llama/llama-4-scout-17b-16e-instruct",
        "messages": [
            {"role": "system", "content": system_role},
            {"role": "user", "content": query}
        ],
        "temperature": 0.7,
        "max_tokens": 2000,  # Add max tokens to ensure complete responses
        "stream": False
    }
    
    try:
        logger.info(f"Sending request to Grok API: {GROK_API_URL}")
        logger.debug(f"Payload: {payload}")
        
        response = requests.post(
            GROK_API_URL, 
            json=payload, 
            headers=headers,
            timeout=60  # Add timeout to prevent hanging
        )
        response.raise_for_status()
        
        data = response.json()
        logger.debug(f"API Response: {data}")
        
        if "choices" in data and len(data["choices"]) > 0:
            content = data["choices"][0]["message"]["content"]
            if content:
                logger.info("Successfully received response from Grok API")
                return content
            else:
                logger.warning("Empty content received from API")
                return "No content generated from AI service."
        else:
            logger.warning("No choices found in API response")
            return "No response generated from AI service."
            
    except requests.exceptions.Timeout:
        error_msg = "Request to AI service timed out. Please try again."
        logger.error(error_msg)
        return error_msg
    except requests.exceptions.RequestException as e:
        error_msg = f"API request failed: {str(e)}"
        logger.error(error_msg)
        return error_msg
    except Exception as e:
        error_msg = f"Unexpected error: {str(e)}"
        logger.error(error_msg)
        return error_msg