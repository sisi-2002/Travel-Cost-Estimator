# TripCraft Backend

A Python FastAPI backend for TripCraft travel application with user authentication using MongoDB Atlas.

## Features

- **User Authentication**: Registration, login, and profile management
- **JWT Token-based Security**: Secure authentication with JSON Web Tokens
- **MongoDB Atlas Integration**: Cloud-based NoSQL database
- **Password Hashing**: Secure password storage using bcrypt
- **CORS Support**: Cross-origin resource sharing for frontend integration
- **Input Validation**: Pydantic models for data validation
- **Error Handling**: Comprehensive error handling and logging

## API Endpoints

### Authentication Endpoints

- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `GET /api/v1/auth/me` - Get current user profile
- `PUT /api/v1/auth/me` - Update user profile
- `POST /api/v1/auth/change-password` - Change password
- `DELETE /api/v1/auth/me` - Deactivate account

### General Endpoints

- `GET /` - Root endpoint
- `GET /health` - Health check
- `GET /docs` - Interactive API documentation (Swagger UI)

## Setup Instructions

### Prerequisites

- Python 3.8+
- MongoDB Atlas account
- pip or conda package manager

### Installation

1. **Clone the repository and navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create a virtual environment:**
   ```bash
   python -m venv venv
   
   # On Windows
   venv\Scripts\activate
   
   # On macOS/Linux
   source venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables:**
   ```bash
   # Copy the example environment file
   cp env.example .env
   
   # Edit .env with your actual values
   ```

### Environment Variables

Create a `.env` file in the backend directory with the following variables:

```env
# MongoDB Atlas Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/tripcraft?retryWrites=true&w=majority
DATABASE_NAME=tripcraft

# JWT Configuration
SECRET_KEY=your-secret-key-here-make-it-long-and-random
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Server Configuration
HOST=0.0.0.0
PORT=8005
DEBUG=True
```

### MongoDB Atlas Setup

1. **Create a MongoDB Atlas account** at [mongodb.com](https://www.mongodb.com/cloud/atlas)
2. **Create a new cluster** (free tier available)
3. **Set up database access** with a username and password
4. **Set up network access** to allow connections from your IP
5. **Get your connection string** and update the `MONGODB_URI` in your `.env` file

### Running the Application

1. **Start the server:**
   ```bash
   python main.py
   ```

2. **Or use uvicorn directly:**
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8005 --reload
   ```

3. **Access the API:**
   - API: http://localhost:8005
   - Documentation: http://localhost:8005/docs
   - Health Check: http://localhost:8005/health

## API Usage Examples

### User Registration

```bash
curl -X POST "http://localhost:8005/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "full_name": "John Doe",
    "phone": "+1234567890",
    "password": "securepassword123"
  }'
```

### User Login

```bash
curl -X POST "http://localhost:8005/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword123"
  }'
```

### Get User Profile (Authenticated)

```bash
curl -X GET "http://localhost:8005/api/v1/auth/me" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Project Structure

```
backend/
├── __init__.py
├── main.py              # FastAPI application entry point
├── config.py            # Configuration and environment variables
├── database.py          # MongoDB connection and management
├── models.py            # Pydantic data models
├── auth.py              # Authentication utilities
├── crud.py              # Database CRUD operations
├── routers/
│   ├── __init__.py
│   └── auth.py          # Authentication endpoints
├── requirements.txt      # Python dependencies
├── env.example          # Environment variables template
└── README.md            # This file
```

## Security Features

- **Password Hashing**: Passwords are hashed using bcrypt
- **JWT Tokens**: Secure token-based authentication
- **Input Validation**: All inputs are validated using Pydantic models
- **CORS Protection**: Configured CORS for secure frontend integration
- **Error Handling**: Secure error responses without exposing sensitive information

## Development

### Adding New Endpoints

1. Create new router files in the `routers/` directory
2. Define your endpoints using FastAPI decorators
3. Include the router in `main.py`

### Database Operations

- Use the `user_crud` instance for user-related operations
- Create new CRUD classes for other entities
- All database operations are async and use MongoDB

### Testing

The API includes comprehensive error handling and validation. Test endpoints using:

- **Swagger UI**: http://localhost:8005/docs
- **Postman** or similar API testing tools
- **cURL** commands for quick testing

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**: Check your connection string and network access
2. **Import Errors**: Ensure all dependencies are installed and virtual environment is activated
3. **Port Already in Use**: Change the port in `.env` or kill the process using the port

### Logs

Check the console output for detailed logging information about:
- Database connections
- API requests
- Error details
- Application lifecycle events

## Contributing

1. Follow the existing code structure and patterns
2. Add proper error handling and logging
3. Update documentation for new features
4. Test thoroughly before submitting changes

## License

This project is part of the TripCraft application.
