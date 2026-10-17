-- =============================================================================
-- Migration: V1__init_notification_schema.sql
-- Description: Create initial schema for Notification Service (In-App notifications and delivery tracking)
-- =============================================================================

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    notification_type VARCHAR(50) NOT NULL,
    channel VARCHAR(30) NOT NULL DEFAULT 'IN_APP',
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    reference_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications (user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications (created_at DESC);

CREATE TABLE IF NOT EXISTS email_delivery_logs (
    id UUID PRIMARY KEY,
    event_id UUID,
    notification_type VARCHAR(50) NOT NULL,
    recipient_email VARCHAR(255) NOT NULL,
    subject VARCHAR(255),
    delivery_status VARCHAR(30) NOT NULL,
    attempt_count INT NOT NULL DEFAULT 1,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_email_delivery_event_type UNIQUE (event_id, notification_type)
);

CREATE INDEX IF NOT EXISTS idx_email_delivery_recipient ON email_delivery_logs (recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_delivery_event_id ON email_delivery_logs (event_id);
CREATE INDEX IF NOT EXISTS idx_email_delivery_status ON email_delivery_logs (delivery_status);
