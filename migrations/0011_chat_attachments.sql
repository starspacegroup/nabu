-- Add attachments column to chat_messages for storing user-uploaded media
-- Stores JSON array of attachment metadata (images/videos attached to messages)
ALTER TABLE chat_messages ADD COLUMN attachments TEXT DEFAULT NULL;
