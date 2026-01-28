import pymysql
from datetime import datetime, timedelta

# Database connection
connection = pymysql.connect(
    host='localhost',
    user='httpdvic1_admin',
    password='JVI~dEtn6#gs',
    database='leadlabv2'
)

try:
    with connection.cursor() as cursor:
        # Check events
        sql = """
        SELECT id, title, event_type, status, start_date, end_date 
        FROM events 
        WHERE organization_id = 1 
        ORDER BY start_date DESC 
        LIMIT 5;
        """
        cursor.execute(sql)
        events = cursor.fetchall()
        print("\nLatest Events:")
        for event in events:
            print(event)

        # Check upcoming meetings
        now = datetime.utcnow()
        week_later = now + timedelta(days=7)
        sql = """
        SELECT COUNT(*) 
        FROM events 
        WHERE organization_id = 1 
        AND event_type IN ('meeting', 'video_call')
        AND status = 'scheduled'
        AND start_date > %s
        AND start_date <= %s;
        """
        cursor.execute(sql, (now, week_later))
        upcoming_count = cursor.fetchone()[0]
        print(f"\nUpcoming Meetings Count: {upcoming_count}")
        print(f"Date Range: {now} to {week_later}")

finally:
    connection.close()
