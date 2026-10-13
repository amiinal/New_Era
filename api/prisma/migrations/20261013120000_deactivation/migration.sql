-- Hibernation: accounts can deactivate (hidden + signed out) and reopen
-- later; permanent delete only after 90 days hibernating, customers only.
ALTER TABLE "Account" ADD COLUMN "deactivatedAt" TIMESTAMP(3);
