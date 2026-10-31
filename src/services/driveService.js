/**
 * Google Drive API Service
 * Fetches all media files (images + videos) from the Bandarban trip folder.
 * Implements a nextPageToken while-loop to guarantee all 437 files are loaded.
 */

const FOLDER_ID  = import.meta.env.VITE_GOOGLE_DRIVE_FOLDER_ID;
const API_KEY    = import.meta.env.VITE_GOOGLE_DRIVE_API_KEY;
const BASE_URL   = 'https://www.googleapis.com/drive/v3/files';

// ─── URL helpers ─────────────────────────────────────────────────────────────

/** Direct view URL (images rendered via <img>) */
export const viewUrl = (id) =>
  `https://drive.google.com/uc?export=view&id=${id}`;

/** Inline preview URL (videos rendered via <iframe>) */
export const previewUrl = (id) =>
  `https://drive.google.com/file/d/${id}/preview`;

/** Forces a direct original-quality download (used for bulk-download) */
export const downloadUrl = (id) =>
  `https://drive.google.com/uc?export=download&id=${id}`;

/**
 * High-res lh3 CDN thumbnail fallback — avoids Drive uc view rate limits
 * for image previews inside cards.
 */
export const lhThumbnailUrl = (thumbnailLink, width = 1200) =>
  thumbnailLink
    ? thumbnailLink.replace(/=s\d+.*$/, `=w${width}`)
    : null;

// ─── Media type helpers ───────────────────────────────────────────────────────

export const isVideo = (mimeType = '') => mimeType.startsWith('video/');
export const isImage = (mimeType = '') => mimeType.startsWith('image/');

// ─── Pagination fetch ─────────────────────────────────────────────────────────

/**
 * Fetches ALL files from the Drive folder using a while-loop over nextPageToken.
 * @param {(count: number) => void} [onProgress] - Live progress callback
 * @returns {Promise<Array>} Unified array of all mapped media files
 */
export async function fetchAllDriveMedia(onProgress) {
  if (!FOLDER_ID || !API_KEY) {
    throw new Error(
      'Missing VITE_GOOGLE_DRIVE_FOLDER_ID or VITE_GOOGLE_DRIVE_API_KEY in your .env file.'
    );
  }

  const allFiles = [];
  let pageToken  = null;

  while (true) {
    const url = new URL(BASE_URL);
    url.searchParams.set('q',         `'${FOLDER_ID}' in parents and trashed = false`);
    url.searchParams.set('key',        API_KEY);
    url.searchParams.set('pageSize',  '100');
    url.searchParams.set(
      'fields',
      'nextPageToken, files(id, name, mimeType, size, createdTime, thumbnailLink, imageMediaMetadata)'
    );
    if (pageToken) url.searchParams.set('pageToken', pageToken);

    const response = await fetch(url.toString());
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err?.error?.message ?? `Drive API error: HTTP ${response.status}`);
    }

    const data  = await response.json();
    const files = data.files ?? [];

    for (const file of files) {
      // Accept only image and video mimeTypes
      if (!isImage(file.mimeType) && !isVideo(file.mimeType)) continue;

      allFiles.push({
        id:           file.id,
        name:         file.name,
        mimeType:     file.mimeType,
        size:         file.size ? formatBytes(file.size) : null,
        createdTime:  file.createdTime ?? null,
        metadata:     file.imageMediaMetadata ?? null,
        thumbnailLink: file.thumbnailLink ?? null,
        // Resolved URLs
        viewUrl:      isImage(file.mimeType) ? viewUrl(file.id)    : null,
        previewUrl:   isVideo(file.mimeType) ? previewUrl(file.id) : null,
        downloadUrl:  downloadUrl(file.id),
        lhPreview:    lhThumbnailUrl(file.thumbnailLink),
        isVideo:      isVideo(file.mimeType),
        isImage:      isImage(file.mimeType),
      });
    }

    onProgress?.(allFiles.length);

    pageToken = data.nextPageToken;
    if (!pageToken) break; // ← no more pages, all files loaded
  }

  return allFiles;
}

// ─── Utility ──────────────────────────────────────────────────────────────────

function formatBytes(bytes, decimals = 1) {
  if (!+bytes) return '0 B';
  const k  = 1024;
  const dm = Math.max(0, decimals);
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i  = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
