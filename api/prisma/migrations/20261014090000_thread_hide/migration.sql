-- Conversation hide (not destroy): deleting a conversation removes it for
-- the deleter only. One thread per business+customer; reopening resurrects.
ALTER TABLE "Thread" ADD COLUMN "hiddenFor" TEXT[] NOT NULL DEFAULT '{}';
