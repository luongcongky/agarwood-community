-- Persist public contact-form submissions so admins can see them in
-- /admin/lien-he and the notification bell — not only in the shared
-- Gmail inbox.

CREATE TYPE "ContactStatus" AS ENUM ('NEW', 'HANDLED', 'ARCHIVED');

CREATE TABLE "contact_messages" (
    "id"          TEXT NOT NULL,
    "name"        TEXT NOT NULL,
    "email"       TEXT NOT NULL,
    "phone"       TEXT,
    "message"     TEXT NOT NULL,
    "status"      "ContactStatus" NOT NULL DEFAULT 'NEW',
    "handledAt"   TIMESTAMP(3),
    "handledById" TEXT,
    "adminNote"   TEXT,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contact_messages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "contact_messages_status_createdAt_idx"
  ON "contact_messages"("status", "createdAt");

ALTER TABLE "contact_messages"
  ADD CONSTRAINT "contact_messages_handledById_fkey"
  FOREIGN KEY ("handledById") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
