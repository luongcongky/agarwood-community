-- CreateIndex
CREATE INDEX "posts_status_createdAt_idx" ON "posts"("status", "createdAt");

-- CreateIndex
CREATE INDEX "posts_isPromoted_authorPriority_createdAt_idx" ON "posts"("isPromoted", "authorPriority", "createdAt");

-- CreateIndex
CREATE INDEX "users_accountType_idx" ON "users"("accountType");
