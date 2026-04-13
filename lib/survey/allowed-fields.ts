/**
 * Whitelist các field được phép mirror từ survey answer sang DB.
 * Tách riêng file này (không import prisma) để client bundle tham chiếu được.
 */
export const ALLOWED_FIELDS: Record<string, "string" | "number" | "json"> = {
  // User
  "user.phone": "string",
  "user.bankAccountName": "string",
  "user.bankAccountNumber": "string",
  "user.bankName": "string",
  // Company
  "company.name": "string",
  "company.description": "string",
  "company.website": "string",
  "company.phone": "string",
  "company.address": "string",
  "company.foundedYear": "number",
  "company.employeeCount": "string",
  "company.businessLicense": "string",
  "company.representativeName": "string",
  "company.representativePosition": "string",
}

export function isAllowedMapsTo(path: string | undefined): boolean {
  if (!path) return false
  return path in ALLOWED_FIELDS
}

export function listAllowedFields(): string[] {
  return Object.keys(ALLOWED_FIELDS)
}
