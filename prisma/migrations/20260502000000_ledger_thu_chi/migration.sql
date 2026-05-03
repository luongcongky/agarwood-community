-- Phase 1 (2026-05-02): Sổ quỹ thu chi của Hội — admin only.
--
-- Single-account ledger: hội dùng 1 tài khoản duy nhất, ghi nhận thực tế
-- (không có module budget). Số dư = SUM(income) - SUM(expense). Số dư đầu kỳ
-- là 1 transaction system (category isSystem=true) nhập 1 lần qua wizard.
--
-- amount: BIGINT VND nguyên đồng. JS Number an toàn tới 2^53 ≈ 9 * 10^15
-- → đủ cho mọi nghiệp vụ hội.

CREATE TYPE "LedgerType" AS ENUM ('INCOME', 'EXPENSE');
CREATE TYPE "LedgerPaymentMethod" AS ENUM ('CASH', 'BANK');

CREATE TABLE "ledger_categories" (
    "id"           TEXT         NOT NULL,
    "name"         TEXT         NOT NULL,
    "type"         "LedgerType" NOT NULL,
    "parentId"     TEXT,
    "displayOrder" INTEGER      NOT NULL DEFAULT 0,
    "isActive"     BOOLEAN      NOT NULL DEFAULT true,
    "isSystem"     BOOLEAN      NOT NULL DEFAULT false,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ledger_categories_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ledger_categories_type_displayOrder_idx" ON "ledger_categories"("type", "displayOrder");
CREATE INDEX "ledger_categories_parentId_idx" ON "ledger_categories"("parentId");

ALTER TABLE "ledger_categories"
  ADD CONSTRAINT "ledger_categories_parentId_fkey"
  FOREIGN KEY ("parentId") REFERENCES "ledger_categories"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "ledger_transactions" (
    "id"               TEXT                  NOT NULL,
    "type"             "LedgerType"          NOT NULL,
    "categoryId"       TEXT                  NOT NULL,
    "amount"           BIGINT                NOT NULL,
    "transactionDate"  DATE                  NOT NULL,
    "paymentMethod"    "LedgerPaymentMethod" NOT NULL DEFAULT 'BANK',
    "referenceNo"      TEXT,
    "description"      TEXT                  NOT NULL,
    "receiptUrl"       TEXT,
    "relatedPaymentId" TEXT,
    "isSystem"         BOOLEAN               NOT NULL DEFAULT false,
    "recordedById"     TEXT                  NOT NULL,
    "createdAt"        TIMESTAMP(3)          NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"        TIMESTAMP(3)          NOT NULL,
    CONSTRAINT "ledger_transactions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ledger_transactions_relatedPaymentId_key" ON "ledger_transactions"("relatedPaymentId");
CREATE INDEX "ledger_transactions_type_transactionDate_idx" ON "ledger_transactions"("type", "transactionDate");
CREATE INDEX "ledger_transactions_categoryId_idx" ON "ledger_transactions"("categoryId");
CREATE INDEX "ledger_transactions_transactionDate_idx" ON "ledger_transactions"("transactionDate");
CREATE INDEX "ledger_transactions_recordedById_idx" ON "ledger_transactions"("recordedById");

ALTER TABLE "ledger_transactions"
  ADD CONSTRAINT "ledger_transactions_categoryId_fkey"
  FOREIGN KEY ("categoryId") REFERENCES "ledger_categories"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ledger_transactions"
  ADD CONSTRAINT "ledger_transactions_recordedById_fkey"
  FOREIGN KEY ("recordedById") REFERENCES "users"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ledger_transactions"
  ADD CONSTRAINT "ledger_transactions_relatedPaymentId_fkey"
  FOREIGN KEY ("relatedPaymentId") REFERENCES "payments"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed danh mục mặc định. ID dùng prefix `lcat_` để dễ nhận biết khi debug,
-- và để admin có thể reference từ code (e.g. PaymentType → categoryId map).
-- Các danh mục isSystem=true không cho xóa qua UI nhưng cho rename.

INSERT INTO "ledger_categories" ("id", "name", "type", "displayOrder", "isSystem", "updatedAt") VALUES
  ('lcat_opening_balance',  'Số dư đầu kỳ',                         'INCOME',  0,  true,  CURRENT_TIMESTAMP),
  ('lcat_membership_fee',   'Hội phí thường niên',                  'INCOME',  10, true,  CURRENT_TIMESTAMP),
  ('lcat_certification',    'Phí chứng nhận',                       'INCOME',  20, true,  CURRENT_TIMESTAMP),
  ('lcat_banner',           'Phí banner quảng cáo',                 'INCOME',  30, true,  CURRENT_TIMESTAMP),
  ('lcat_media_service',    'Phí dịch vụ truyền thông',             'INCOME',  40, true,  CURRENT_TIMESTAMP),
  ('lcat_donation',         'Tài trợ / Đóng góp',                   'INCOME',  50, false, CURRENT_TIMESTAMP),
  ('lcat_event_income',     'Thu sự kiện',                          'INCOME',  60, false, CURRENT_TIMESTAMP),
  ('lcat_other_income',     'Thu khác',                             'INCOME',  90, false, CURRENT_TIMESTAMP),
  ('lcat_operations',       'Vận hành (văn phòng / website)',       'EXPENSE', 10, false, CURRENT_TIMESTAMP),
  ('lcat_event_expense',    'Tổ chức sự kiện',                      'EXPENSE', 20, false, CURRENT_TIMESTAMP),
  ('lcat_council_expense',  'Chi phí Hội đồng thẩm định',           'EXPENSE', 30, false, CURRENT_TIMESTAMP),
  ('lcat_member_support',   'Quà tặng / Hỗ trợ hội viên',           'EXPENSE', 40, false, CURRENT_TIMESTAMP),
  ('lcat_refund',           'Hoàn tiền',                            'EXPENSE', 50, true,  CURRENT_TIMESTAMP),
  ('lcat_other_expense',    'Chi khác',                             'EXPENSE', 90, false, CURRENT_TIMESTAMP);
