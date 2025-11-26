import { randomUUID } from 'crypto';
import { writeFile, readFile, unlink, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

/**
 * Initialize the upload directory
 */
async function ensureUploadDir(): Promise<void> {
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }
}

/**
 * Generate a unique storage key for a file
 */
function generateStorageKey(originalName: string): string {
  const ext = path.extname(originalName);
  const timestamp = Date.now();
  const uuid = randomUUID();
  return `${timestamp}-${uuid}${ext}`;
}

/**
 * Get the full path for a storage key
 */
function getFilePath(storageKey: string): string {
  return path.join(UPLOAD_DIR, storageKey);
}

export interface StoredFile {
  storageKey: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
}

/**
 * Store a file from a Buffer
 */
export async function storeFile(
  buffer: Buffer,
  originalName: string,
  mimeType: string
): Promise<StoredFile> {
  await ensureUploadDir();
  
  const storageKey = generateStorageKey(originalName);
  const filePath = getFilePath(storageKey);
  
  await writeFile(filePath, buffer);
  
  return {
    storageKey,
    filename: storageKey,
    originalName,
    mimeType,
    size: buffer.length,
  };
}

/**
 * Read a file by its storage key
 */
export async function readStoredFile(storageKey: string): Promise<Buffer> {
  const filePath = getFilePath(storageKey);
  return readFile(filePath);
}

/**
 * Delete a file by its storage key
 */
export async function deleteStoredFile(storageKey: string): Promise<void> {
  const filePath = getFilePath(storageKey);
  if (existsSync(filePath)) {
    await unlink(filePath);
  }
}

/**
 * Check if a file exists
 */
export function fileExists(storageKey: string): boolean {
  return existsSync(getFilePath(storageKey));
}

/**
 * Get allowed MIME types for document upload
 */
export function getAllowedMimeTypes(): string[] {
  return [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/rtf',
    'application/rtf',
  ];
}

/**
 * Validate file type
 */
export function isValidFileType(mimeType: string): boolean {
  return getAllowedMimeTypes().includes(mimeType);
}

/**
 * Get max file size (in bytes) - default 10MB
 */
export function getMaxFileSize(): number {
  return parseInt(process.env.MAX_FILE_SIZE || '10485760', 10);
}

/**
 * Validate file size
 */
export function isValidFileSize(size: number): boolean {
  return size <= getMaxFileSize();
}
