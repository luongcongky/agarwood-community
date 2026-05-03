# Sync database structure from Local (schema.prisma) to Supabase
# Resolves drift using migrate resolve and applies missing migrations.

$env:MIGRATE_TARGET = "supabase"

Write-Host "--- 1. Checking Schema Drift on Supabase ---" -ForegroundColor Cyan
npx tsx scripts/check-supabase-schema-drift.ts

Write-Host "`n--- 2. Resolving Schema Drift (marking migrations as applied) ---" -ForegroundColor Cyan
$driftMigrations = @(
    "20260416100000_add_honorary_contribution",
    "20260416200000_add_user_bio",
    "20260416200000_baseline_db_push_drift",
    "20260416300000_baseline_db_push_drift_part2",
    "20260417000000_add_i18n_columns",
    "20260418000000_add_profile_i18n_columns",
    "20260419000000_add_contact_messages",
    "20260420000000_add_arabic_locale_columns",
    "20260420010000_add_news_banner_perf_indexes",
    "20260420020000_add_news_seo_fields",
    "20260421000000_add_hdtd_leader_category",
    "20260421010000_add_document_ticker_index",
    "20260421020000_add_company_gallery_images"
)

foreach ($m in $driftMigrations) {
    Write-Host "Marking $m as applied..." -ForegroundColor Gray
    npx prisma migrate resolve --applied $m
}

Write-Host "`n--- 3. Applying missing Migrations to Supabase ---" -ForegroundColor Cyan
npx prisma migrate deploy

Write-Host "`n--- 4. Checking final migration status ---" -ForegroundColor Cyan
npx tsx scripts/check-supabase-migrations.ts

Write-Host "`n✅ Structure sync to Supabase completed!" -ForegroundColor Green
