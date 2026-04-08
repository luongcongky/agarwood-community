import { google } from "googleapis"
import { Readable } from "stream"

// ── Auth ─────────────────────────────────────────────────────────────────────

function getAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!
  const key = process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, "\n")

  return new google.auth.JWT({
    email,
    key,
    scopes: ["https://www.googleapis.com/auth/drive"],
  })
}

function getDrive() {
  return google.drive({ version: "v3", auth: getAuth() })
}

const ROOT_FOLDER_ID = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID!

// ── Folder structure ─────────────────────────────────────────────────────────

// Map category to Drive folder name
const CATEGORY_FOLDERS: Record<string, string> = {
  CONG_VAN_DEN: "Công văn đến",
  CONG_VAN_DI: "Công văn đi",
  BIEN_BAN_HOP: "Biên bản họp",
  QUYET_DINH: "Quyết định",
  HOP_DONG: "Hợp đồng",
}

/**
 * Find or create a folder by name inside a parent folder.
 */
async function findOrCreateFolder(name: string, parentId: string): Promise<string> {
  const drive = getDrive()

  // Search for existing folder
  const res = await drive.files.list({
    q: `name='${name}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: "files(id)",
    spaces: "drive",
  })

  if (res.data.files && res.data.files.length > 0) {
    return res.data.files[0].id!
  }

  // Create folder
  const folder = await drive.files.create({
    requestBody: {
      name,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentId],
    },
    fields: "id",
  })

  return folder.data.id!
}

/**
 * Get the target folder for a document category + year.
 * Creates folder structure if not exists:
 * Root / Category / Year
 */
async function getTargetFolder(category: string, year?: number): Promise<string> {
  const categoryName = CATEGORY_FOLDERS[category] ?? category
  const categoryFolderId = await findOrCreateFolder(categoryName, ROOT_FOLDER_ID)

  if (year) {
    return findOrCreateFolder(String(year), categoryFolderId)
  }
  return categoryFolderId
}

// ── Upload ───────────────────────────────────────────────────────────────────

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]

const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20MB

export type UploadResult = {
  driveFileId: string
  driveViewUrl: string
  driveDownloadUrl: string
  fileName: string
  mimeType: string
  fileSize: number
}

/**
 * Upload a file to Google Drive.
 * Returns Drive file metadata for storing in DB.
 */
export async function uploadToDrive(
  file: Buffer,
  fileName: string,
  mimeType: string,
  category: string,
  year?: number,
): Promise<UploadResult> {
  // Validate
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    throw new Error("Chỉ chấp nhận file PDF, DOC, DOCX")
  }
  if (file.length > MAX_FILE_SIZE) {
    throw new Error("File tối đa 20MB")
  }

  const folderId = await getTargetFolder(category, year)
  const drive = getDrive()

  // Upload file
  const res = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [folderId],
    },
    media: {
      mimeType,
      body: Readable.from(file),
    },
    fields: "id,name,mimeType,size,webViewLink,webContentLink",
  })

  const fileId = res.data.id!

  // Set "Anyone with link can view" for Google Docs Viewer preview
  await drive.permissions.create({
    fileId,
    requestBody: {
      role: "reader",
      type: "anyone",
    },
  })

  return {
    driveFileId: fileId,
    driveViewUrl: `https://drive.google.com/file/d/${fileId}/view`,
    driveDownloadUrl: `https://drive.google.com/uc?export=download&id=${fileId}`,
    fileName,
    mimeType,
    fileSize: file.length,
  }
}

// ── View & Download URLs ─────────────────────────────────────────────────────

/**
 * Get Google Docs Viewer embed URL for iframe preview.
 */
export function getPreviewUrl(driveFileId: string): string {
  return `https://docs.google.com/viewer?url=https://drive.google.com/uc?id=${driveFileId}&embedded=true`
}

/**
 * Get direct download URL (proxied through server).
 */
export function getDownloadUrl(driveFileId: string): string {
  return `https://drive.google.com/uc?export=download&id=${driveFileId}`
}

// ── Delete ───────────────────────────────────────────────────────────────────

/**
 * Delete a file from Google Drive.
 */
export async function deleteFromDrive(driveFileId: string): Promise<void> {
  const drive = getDrive()
  await drive.files.delete({ fileId: driveFileId })
}

// ── List folder contents ─────────────────────────────────────────────────────

/**
 * List files in a Drive folder (for debugging/admin).
 */
export async function listDriveFolder(folderId?: string): Promise<{ id: string; name: string; mimeType: string }[]> {
  const drive = getDrive()
  const res = await drive.files.list({
    q: `'${folderId ?? ROOT_FOLDER_ID}' in parents and trashed=false`,
    fields: "files(id,name,mimeType)",
    orderBy: "name",
  })
  return (res.data.files ?? []).map((f) => ({
    id: f.id!,
    name: f.name!,
    mimeType: f.mimeType!,
  }))
}

export { CATEGORY_FOLDERS, ALLOWED_MIME_TYPES, MAX_FILE_SIZE }
