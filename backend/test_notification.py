from app.database import SessionLocal
from app.services.notification_service import NotificationService

# Test notification oluştur
db = SessionLocal()
try:
    notification = NotificationService.create_notification(
        db=db,
        user_id=1,  # Admin user
        title='Welcome to LeadLab!',
        message='Notification system is now active and working perfectly!',
        link='/dashboard',
        notification_type='success',
        priority='high'
    )
    print(f'Test notification created with ID: {notification.id}')
finally:
    db.close() 