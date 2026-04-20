from app.api.v1.endpoints.messages import (
    _parse_attachment_message,
    _serialize_attachment_message,
)


def test_attachment_roundtrip_serialization():
    content = _serialize_attachment_message(
        filename="contract.pdf",
        stored_name="abc_contract.pdf",
        size_bytes=2048,
        content_type="application/pdf",
    )
    parsed = _parse_attachment_message(content)

    assert parsed is not None
    assert parsed["filename"] == "contract.pdf"
    assert parsed["stored_name"] == "abc_contract.pdf"
    assert parsed["size_bytes"] == 2048
    assert parsed["content_type"] == "application/pdf"


def test_attachment_parser_rejects_plain_text():
    parsed = _parse_attachment_message("hello this is a normal chat message")
    assert parsed is None
