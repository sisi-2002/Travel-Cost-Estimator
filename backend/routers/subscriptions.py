# routers/subscriptions.py
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import JSONResponse
import stripe
from config import settings
from auth import get_current_active_user
from crud import user_crud
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

router = APIRouter()

# Set Stripe API key
stripe.api_key = settings.stripe_secret_key

@router.post("/subscribe")
async def create_checkout_session(current_user: dict = Depends(get_current_active_user)):
    """Create Stripe checkout session for premium subscription"""
    try:
        # Create checkout session
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[
                {
                    'price': settings.premium_priceid,
                    'quantity': 1,
                },
            ],
            mode='subscription',
            customer_email=current_user['email'],
            success_url='http://localhost:8080/success?session_id={CHECKOUT_SESSION_ID}',  
            cancel_url='http://localhost:8080/cancel',
            metadata={'user_id': current_user['id']}
        )
        
        return {"session_id": session.id}
    
    except Exception as e:
        logger.error(f"Error creating checkout session: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/subscription/webhook")
async def stripe_webhook(request: Request):
    """Handle Stripe webhook events"""
    payload = await request.body()
    sig_header = request.headers.get('stripe-signature')
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.web_hook_secret
        )
    except ValueError as e:
        # Invalid payload
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError as e:
        # Invalid signature
        raise HTTPException(status_code=400, detail="Invalid signature")
    
    # Handle the event
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        user_id = session['metadata'].get('user_id')
        if user_id:
            payment_detail = {
                'payment_id': session['payment_intent'],
                'amount': session['amount_total'] / 100 if session['amount_total'] else 0,
                'currency': session['currency'].upper(),
                'date': datetime.utcnow(),
                'status': 'completed'
            }
            await user_crud.upgrade_to_premium(user_id, payment_detail)
            logger.info(f"Premium subscription activated for user {user_id}")
    
    # ... handle other event types if needed
    
    return JSONResponse(status_code=200, content={"status": "success"})