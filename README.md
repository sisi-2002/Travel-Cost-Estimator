# TravelCraft

A comprehensive API for estimating travel costs including flights, hotels, and daily expenses. Built with FastAPI, SQLAlchemy, and async Python.

## Features

- **Flight Cost Estimation**: Search and estimate flight prices with multiple airlines
- **Hotel Cost Estimation**: Find hotels and estimate accommodation costs
- **Expense Calculation**: Calculate daily expenses including food, transportation, activities, and shopping
- **Complete Trip Estimates**: Get comprehensive cost estimates for entire trips
- **Price Trends**: Track price trends and get booking recommendations
- **Currency Conversion**: Convert costs between different currencies
- **RESTful API**: Clean, documented API with automatic OpenAPI/Swagger documentation
LLM 

## Project Structure

```
travel-cost-estimator/
├── .env                          # Environment variables
├── requirements.txt              # Python dependencies
├── main.py                      # Entry point
├── config/
│   └── settings.py              # Configuration management
├── agents/
│   ├── __init__.py
│   ├── flight_agent.py          # Flight price agent
│   ├── hotel_agent.py           # Hotel price agent
│   ├── expense_agent.py         # Expense calculation agent
│   └── tools/                   # Custom tools for agents
│       ├── __init__.py
│       ├── flight_tools.py
│       ├── hotel_tools.py
│       └── expense_tools.py
├── api/
│   ├── __init__.py
│   ├── routes.py                # API endpoints
│   └── models.py                # Pydantic models
├── database/
│   ├── __init__.py
│   ├── models.py                # Database models
│   └── connection.py            # DB connection
├── frontend/                    # React/HTML frontend
├── tests/
├── docs/
└── README.md
```

## Installation

### Prerequisites

- Python 3.8+
- pip
- virtualenv (recommended)

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/travel-cost-estimator.git
cd travel-cost-estimator
```

### 2. Create Virtual Environment

```bash
# Windows
python -m venv travel-env
travel-env\Scripts\activate

# Linux/Mac
python -m venv travel-env
source travel-env/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Environment Configuration

Create a `.env` file in the root directory:

```env
# Database Configuration
DATABASE_URL=sqlite:///./travel_costs.db

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
DEBUG=True

# External API Keys (replace with actual keys)
FLIGHT_API_KEY=your_flight_api_key_here
HOTEL_API_KEY=your_hotel_api_key_here
WEATHER_API_KEY=your_weather_api_key_here

# Logging Configuration
LOG_LEVEL=INFO
LOG_FILE=logs/travel_estimator.log

# Security
SECRET_KEY=your_secret_key_here_change_in_production
JWT_SECRET_KEY=your_jwt_secret_key_here

# CORS Settings
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8080

# Rate Limiting
RATE_LIMIT_PER_MINUTE=60
```

### 5. Initialize Database

```bash
python -c "from database.connection import init_db; import asyncio; asyncio.run(init_db())"
```

### 6. Run the Application

```bash
# Development mode
python main.py

# Or using uvicorn directly
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

The API will be available at `http://localhost:8000`

## API Documentation

Once the application is running, you can access:

- **Interactive API Documentation**: http://localhost:8000/docs
- **ReDoc Documentation**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health

## API Endpoints

### Flight Endpoints

- `POST /api/v1/flights/search` - Search for available flights
- `POST /api/v1/flights/estimate` - Estimate flight costs
- `GET /api/v1/flights/trends/{origin}/{destination}` - Get flight price trends

### Hotel Endpoints

- `POST /api/v1/hotels/search` - Search for available hotels
- `POST /api/v1/hotels/estimate` - Estimate hotel costs
- `GET /api/v1/hotels/trends/{location}` - Get hotel price trends
- `GET /api/v1/hotels/amenities/{location}` - Get common hotel amenities

### Expense Endpoints

- `POST /api/v1/expenses/calculate` - Calculate travel expenses
- `GET /api/v1/expenses/cost-of-living/{destination}` - Get cost of living information
- `POST /api/v1/expenses/convert-currency` - Convert between currencies

### Combined Trip Endpoints

- `POST /api/v1/trips/estimate` - Estimate complete trip costs

## Usage Examples

### Search for Flights

```python
import requests

# Search for flights
response = requests.post("http://localhost:8000/api/v1/flights/search", json={
    "origin": "JFK",
    "destination": "LAX",
    "departure_date": "2024-06-15",
    "return_date": "2024-06-22",
    "passengers": 2,
    "cabin_class": "economy",
    "currency": "USD"
})

flights = response.json()
print(f"Found {flights['total_count']} flights")
```

### Estimate Hotel Costs

```python
# Estimate hotel costs
response = requests.post("http://localhost:8000/api/v1/hotels/estimate", json={
    "location": "New York",
    "check_in_date": "2024-06-15",
    "check_out_date": "2024-06-22",
    "guests": 2,
    "rooms": 1,
    "star_rating": 4,
    "currency": "USD"
})

estimate = response.json()
print(f"Estimated hotel cost: ${estimate['estimated_cost']}")
```

### Calculate Complete Trip

```python
# Estimate complete trip
response = requests.post("http://localhost:8000/api/v1/trips/estimate", json={
    "origin": "JFK",
    "destination": "Paris",
    "departure_date": "2024-06-15",
    "return_date": "2024-06-22",
    "passengers": 2,
    "cabin_class": "economy",
    "hotel_guests": 2,
    "hotel_rooms": 1,
    "hotel_star_rating": 4,
    "travel_style": "moderate",
    "include_expenses": True,
    "currency": "USD"
})

trip = response.json()
print(f"Total trip cost: ${trip['total_estimated_cost']}")
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | Database connection string | `sqlite:///./travel_costs.db` |
| `API_HOST` | API server host | `0.0.0.0` |
| `API_PORT` | API server port | `8000` |
| `DEBUG` | Debug mode | `True` |
| `FLIGHT_API_KEY` | Flight search API key | `""` |
| `HOTEL_API_KEY` | Hotel search API key | `""` |
| `WEATHER_API_KEY` | Weather API key | `""` |
| `LOG_LEVEL` | Logging level | `INFO` |
| `SECRET_KEY` | Application secret key | `""` |
| `ALLOWED_ORIGINS` | CORS allowed origins | `["http://localhost:3000"]` |

### Database Configuration

The application supports multiple database backends:

- **SQLite** (default): `sqlite:///./travel_costs.db`
- **PostgreSQL**: `postgresql://user:password@localhost/travel_costs`
- **MySQL**: `mysql://user:password@localhost/travel_costs`

## Development

### Running Tests

```bash
# Install test dependencies
pip install pytest pytest-asyncio

# Run tests
pytest

# Run tests with coverage
pytest --cov=.
```

### Code Formatting

```bash
# Install development dependencies
pip install black flake8 mypy

# Format code
black .

# Lint code
flake8 .

# Type checking
mypy .
```
### 6. Run the Application
### Database Migrations

```bash
# Install Alembic
pip install alembic

# Initialize migrations
alembic init alembic

# Create migration
alembic revision --autogenerate -m "Initial migration"

# Apply migrations
alembic upgrade head
```

## Deployment

### Docker Deployment

```dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Production Configuration

For production deployment:

1. Set `DEBUG=False`
2. Use a production database (PostgreSQL/MySQL)
3. Configure proper CORS settings
4. Set secure secret keys
5. Enable HTTPS
6. Configure logging
7. Set up monitoring and health checks

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions:

- Create an issue on GitHub
- Check the API documentation at `/docs`
- Review the code examples in this README

## Roadmap

- [ ] Real-time flight and hotel data integration
- [ ] User authentication and account management
- [ ] Trip planning and booking features
- [ ] Mobile application
- [ ] Advanced analytics and reporting
- [ ] Multi-language support
- [ ] Integration with travel booking platforms
