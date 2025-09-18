// LS-96-7: Enhanced file validation for medical documents
// Security validations for content verification and privacy protection

/**
 * Magic number signatures for allowed file types
 * These verify the actual file content, not just the mimetype
 */
const FILE_SIGNATURES = {
  // PDF files
  PDF: [0x25, 0x50, 0x44, 0x46], // %PDF
  
  // JPEG images
  JPEG: [0xFF, 0xD8, 0xFF],
  
  // PNG images  
  PNG: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
  
  // GIF images
  GIF_87A: [0x47, 0x49, 0x46, 0x38, 0x37, 0x61], // GIF87a
  GIF_89A: [0x47, 0x49, 0x46, 0x38, 0x39, 0x61], // GIF89a
  
  // WebP images
  WEBP: [0x52, 0x49, 0x46, 0x46], // RIFF header (followed by WEBP at offset 8)
  
  // MS Word documents
  DOC: [0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1], // OLE header
  
  // MS Word DOCX (ZIP-based)
  DOCX: [0x50, 0x4B, 0x03, 0x04], // ZIP signature (DOCX is a ZIP file)
} as const;

/**
 * Allowed MIME types for medical documents
 */
export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/gif',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
] as const;

/**
 * Safe preview MIME types (subset of allowed types)
 */
export const PREVIEWABLE_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png', 
  'image/gif',
  'image/webp'
] as const;

/**
 * Maximum file size for medical documents (10MB)
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Verifies if file buffer matches expected magic number signature
 */
function verifyFileSignature(buffer: Buffer, mimetype: string): boolean {
  const firstBytes = Array.from(buffer.subarray(0, 16));
  
  switch (mimetype) {
    case 'application/pdf':
      return firstBytes.slice(0, 4).every((byte, i) => byte === FILE_SIGNATURES.PDF[i]);
      
    case 'image/jpeg':
    case 'image/jpg':
      return firstBytes.slice(0, 3).every((byte, i) => byte === FILE_SIGNATURES.JPEG[i]);
      
    case 'image/png':
      return firstBytes.slice(0, 8).every((byte, i) => byte === FILE_SIGNATURES.PNG[i]);
      
    case 'image/gif':
      return firstBytes.slice(0, 6).every((byte, i) => byte === FILE_SIGNATURES.GIF_87A[i]) ||
             firstBytes.slice(0, 6).every((byte, i) => byte === FILE_SIGNATURES.GIF_89A[i]);
      
    case 'image/webp':
      // WebP: RIFF header + "WEBP" at offset 8
      return firstBytes.slice(0, 4).every((byte, i) => byte === FILE_SIGNATURES.WEBP[i]) &&
             firstBytes.length >= 12 &&
             firstBytes[8] === 0x57 && firstBytes[9] === 0x45 && 
             firstBytes[10] === 0x42 && firstBytes[11] === 0x50; // "WEBP"
      
    case 'application/msword':
      return firstBytes.slice(0, 8).every((byte, i) => byte === FILE_SIGNATURES.DOC[i]);
      
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      return firstBytes.slice(0, 4).every((byte, i) => byte === FILE_SIGNATURES.DOCX[i]);
      
    default:
      return false;
  }
}

/**
 * Enhanced validation for medical document uploads
 * Includes magic number verification, size limits, and content validation
 */
export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  securityWarnings?: string[];
}

export function validateMedicalFile(file: Express.Multer.File): FileValidationResult {
  const warnings: string[] = [];
  
  // 1. Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: "File size exceeds 10MB limit"
    };
  }
  
  // 2. Check if MIME type is allowed
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype as any)) {
    return {
      isValid: false,
      error: `File type '${file.mimetype}' is not allowed for medical documents`
    };
  }
  
  // 3. Verify magic number signature matches MIME type
  if (!verifyFileSignature(file.buffer, file.mimetype)) {
    return {
      isValid: false,
      error: "File content does not match declared file type (potential security risk)"
    };
  }
  
  // 4. Additional security checks
  if (file.originalname.includes('..') || file.originalname.includes('/') || file.originalname.includes('\\')) {
    warnings.push("File name contains potentially unsafe characters");
  }
  
  // 5. Check for suspicious file extensions
  const extension = file.originalname.toLowerCase().split('.').pop();
  const expectedExtensions: { [key: string]: string[] } = {
    'application/pdf': ['pdf'],
    'image/jpeg': ['jpg', 'jpeg'],
    'image/jpg': ['jpg', 'jpeg'], 
    'image/png': ['png'],
    'image/gif': ['gif'],
    'image/webp': ['webp'],
    'application/msword': ['doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['docx']
  };
  
  const allowedExtensions = expectedExtensions[file.mimetype] || [];
  if (extension && !allowedExtensions.includes(extension)) {
    warnings.push(`File extension '${extension}' does not match MIME type '${file.mimetype}'`);
  }
  
  return {
    isValid: true,
    securityWarnings: warnings.length > 0 ? warnings : undefined
  };
}

/**
 * Sanitizes file data for secure storage
 * Currently returns base64, but could be enhanced for encryption
 */
export function sanitizeFileData(buffer: Buffer): string {
  // For MVP: store as base64
  // TODO: Implement encryption at rest for enhanced security
  return buffer.toString('base64');
}

/**
 * Enhanced security headers for file downloads/previews
 */
export function getSecureFileHeaders(filename: string, mimetype: string, inline = false) {
  return {
    'Content-Type': mimetype,
    'Content-Disposition': `${inline ? 'inline' : 'attachment'}; filename="${filename}"`,
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Content-Security-Policy': "default-src 'none'",
    'Cache-Control': 'private, no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  };
}