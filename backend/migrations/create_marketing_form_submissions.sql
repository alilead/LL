-- PostgreSQL: create table for public marketing form submissions
-- Run once if the table is missing (otherwise use SQLAlchemy create_all / init_render_db).

CREATE TABLE IF NOT EXISTS marketing_form_submissions (
    id SERIAL PRIMARY KEY,
    form_type VARCHAR(50) NOT NULL,
    full_name VARCHAR(200) NOT NULL,
    email VARCHAR(255) NOT NULL,
    company VARCHAR(200),
    phone VARCHAR(50),
    subject VARCHAR(500),
    payload_json TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_marketing_form_submissions_form_type ON marketing_form_submissions (form_type);
CREATE INDEX IF NOT EXISTS ix_marketing_form_submissions_email ON marketing_form_submissions (email);
