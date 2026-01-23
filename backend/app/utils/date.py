from datetime import datetime, date, timezone, timedelta

def parse_date(date_str: str) -> datetime:
    """
    Parse a date string in YYYY-MM-DD format to datetime with Turkey timezone
    """
    try:
        parsed_date = datetime.strptime(date_str, "%Y-%m-%d")
        return parsed_date.replace(tzinfo=timezone(timedelta(hours=3)))  # Turkey timezone (UTC+3)
    except ValueError:
        raise ValueError("Invalid date format. Use YYYY-MM-DD")

def get_timezone_offset() -> timezone:
    """
    Get Turkey timezone (UTC+3)
    """
    return timezone(timedelta(hours=3))
