-- Seed 14 default categories cho ledger. Idempotent — chạy lại không lỗi.
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
  ('lcat_other_expense',    'Chi khác',                             'EXPENSE', 90, false, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
