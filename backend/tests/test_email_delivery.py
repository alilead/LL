from types import SimpleNamespace

from app.services.email_service import EmailService
from app.core.config import settings


class _FakeQuery:
    def __init__(self, account):
        self._account = account

    def filter(self, *args, **kwargs):
        return self

    def first(self):
        return self._account


class _FakeDB:
    def __init__(self, account):
        self._account = account
        self.added = []
        self.commits = 0

    def query(self, model):
        return _FakeQuery(self._account)

    def add(self, value):
        self.added.append(value)

    def commit(self):
        self.commits += 1


def _build_account():
    return SimpleNamespace(
        id=1,
        email="user@example.com",
        display_name="User",
        smtp_host="smtp.gmail.com",
        smtp_port=465,
        smtp_use_tls=False,
        password_encrypted="encrypted",
        organization_id=1,
    )


def test_send_email_auto_falls_back_to_api(monkeypatch):
    account = _build_account()
    service = EmailService(_FakeDB(account))

    monkeypatch.setattr(settings, "EMAIL_PROVIDER", "auto")
    monkeypatch.setattr(service, "_send_email_smtp", lambda *args, **kwargs: False)
    monkeypatch.setattr(service, "_send_email_provider_api", lambda *args, **kwargs: True)
    monkeypatch.setattr(service, "_persist_sent_email", lambda *args, **kwargs: None)

    assert service.send_email(1, ["to@example.com"], "Subject", "Text", "Html") is True


def test_send_email_returns_provider_error_when_all_transports_fail(monkeypatch):
    account = _build_account()
    service = EmailService(_FakeDB(account))

    monkeypatch.setattr(settings, "EMAIL_PROVIDER", "auto")
    monkeypatch.setattr(service, "_send_email_smtp", lambda *args, **kwargs: False)

    def _provider_fail(*args, **kwargs):
        service._set_send_error("PROVIDER_UNAVAILABLE", "Provider timeout", True, 503)
        return False

    monkeypatch.setattr(service, "_send_email_provider_api", _provider_fail)
    monkeypatch.setattr(service, "_persist_sent_email", lambda *args, **kwargs: None)

    assert service.send_email(1, ["to@example.com"], "Subject", "Text", "Html") is False
    assert service.last_send_error_code == "PROVIDER_UNAVAILABLE"
    assert service.last_send_retryable is True
    assert service.last_send_status_code == 503


def test_send_email_raises_for_missing_account(monkeypatch):
    service = EmailService(_FakeDB(None))
    monkeypatch.setattr(settings, "EMAIL_PROVIDER", "auto")

    try:
        service.send_email(999, ["to@example.com"], "Subject")
        assert False, "Expected ValueError for missing account"
    except ValueError as exc:
        assert "Email account not found" in str(exc)
