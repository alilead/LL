import stripe
from app.core.config import settings
import logging
from typing import Optional

logger = logging.getLogger(__name__)

# API anahtarını güvenli bir şekilde ayarla
if hasattr(settings, 'STRIPE_SECRET_KEY') and settings.STRIPE_SECRET_KEY:
    stripe.api_key = settings.STRIPE_SECRET_KEY
    logger.info("Stripe API key configured successfully")
else:
    # Development veya test ortamında düzgün bir mesaj göster
    logger.warning("STRIPE_SECRET_KEY is not set. Stripe functionality will be disabled or limited.")
    stripe.api_key = "dummy_key_for_development"

# Currency değerini kontrol et
STRIPE_CURRENCY = getattr(settings, 'STRIPE_CURRENCY', 'usd')

# Webhook secret değerini kontrol et  
STRIPE_WEBHOOK_SECRET = getattr(settings, 'STRIPE_WEBHOOK_SECRET', None)

async def create_checkout_session(
    customer_email: str,
    token_amount: float,
    success_url: str,
    cancel_url: str
) -> stripe.checkout.Session:
    try:
        session = stripe.checkout.Session.create(
            customer_email=customer_email,
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': STRIPE_CURRENCY,
                    'unit_amount': int(token_amount * 100),  # Convert to cents
                    'product_data': {
                        'name': 'LeadLab Tokens',
                        'description': f'Purchase {token_amount} tokens',
                    },
                },
                'quantity': 1,
            }],
            mode='payment',
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={
                'token_amount': token_amount,
            }
        )
        return session
    except stripe.error.StripeError as e:
        raise ValueError(f"Error creating checkout session: {str(e)}")

async def verify_webhook_signature(payload: bytes, sig_header: str) -> dict:
    try:
        event = stripe.Webhook.construct_event(
            payload,
            sig_header,
            STRIPE_WEBHOOK_SECRET
        )
        return event
    except ValueError as e:
        raise ValueError(f"Invalid payload: {str(e)}")
    except stripe.error.SignatureVerificationError as e:
        raise ValueError(f"Invalid signature: {str(e)}")

async def handle_successful_payment(event: dict) -> float:
    """
    Handle successful payment event and return the token amount
    """
    session = event['data']['object']
    token_amount = float(session['metadata']['token_amount'])
    return token_amount

async def create_refund(payment_intent_id: str) -> stripe.Refund:
    try:
        refund = stripe.Refund.create(
            payment_intent=payment_intent_id
        )
        return refund
    except stripe.error.StripeError as e:
        raise ValueError(f"Error creating refund: {str(e)}")

async def get_payment_intent(payment_intent_id: str) -> stripe.PaymentIntent:
    try:
        payment_intent = stripe.PaymentIntent.retrieve(payment_intent_id)
        return payment_intent
    except stripe.error.StripeError as e:
        raise ValueError(f"Error retrieving payment intent: {str(e)}")

async def get_customer_payment_methods(customer_id: str) -> list:
    try:
        payment_methods = stripe.PaymentMethod.list(
            customer=customer_id,
            type="card"
        )
        return payment_methods.data
    except stripe.error.StripeError as e:
        raise ValueError(f"Error retrieving payment methods: {str(e)}")

async def create_customer(email: str, name: Optional[str] = None) -> stripe.Customer:
    try:
        customer = stripe.Customer.create(
            email=email,
            name=name
        )
        return customer
    except stripe.error.StripeError as e:
        raise ValueError(f"Error creating customer: {str(e)}")

async def attach_payment_method(
    payment_method_id: str,
    customer_id: str
) -> stripe.PaymentMethod:
    try:
        payment_method = stripe.PaymentMethod.attach(
            payment_method_id,
            customer=customer_id
        )
        return payment_method
    except stripe.error.StripeError as e:
        raise ValueError(f"Error attaching payment method: {str(e)}")

async def detach_payment_method(payment_method_id: str) -> stripe.PaymentMethod:
    try:
        payment_method = stripe.PaymentMethod.detach(payment_method_id)
        return payment_method
    except stripe.error.StripeError as e:
        raise ValueError(f"Error detaching payment method: {str(e)}")

async def update_customer_default_payment_method(
    customer_id: str,
    payment_method_id: str
) -> stripe.Customer:
    try:
        customer = stripe.Customer.modify(
            customer_id,
            invoice_settings={
                'default_payment_method': payment_method_id
            }
        )
        return customer
    except stripe.error.StripeError as e:
        raise ValueError(f"Error updating default payment method: {str(e)}")

async def create_payment_intent(
    amount: float,
    customer_id: str,
    payment_method_id: Optional[str] = None,
    setup_future_usage: bool = False
) -> stripe.PaymentIntent:
    try:
        intent_data = {
            'amount': int(amount * 100),  # Convert to cents
            'currency': STRIPE_CURRENCY,
            'customer': customer_id,
            'confirm': True if payment_method_id else False,
        }

        if payment_method_id:
            intent_data['payment_method'] = payment_method_id

        if setup_future_usage:
            intent_data['setup_future_usage'] = 'off_session'

        payment_intent = stripe.PaymentIntent.create(**intent_data)
        return payment_intent
    except stripe.error.StripeError as e:
        raise ValueError(f"Error creating payment intent: {str(e)}")

async def confirm_payment_intent(
    payment_intent_id: str,
    payment_method_id: str
) -> stripe.PaymentIntent:
    try:
        payment_intent = stripe.PaymentIntent.confirm(
            payment_intent_id,
            payment_method=payment_method_id
        )
        return payment_intent
    except stripe.error.StripeError as e:
        raise ValueError(f"Error confirming payment intent: {str(e)}")
