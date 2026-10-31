/**
 * Google Drive API Service
 * Fetches all media files (images + videos) from a given Drive folder.
 * Implements a nextPageToken while-loop to guarantee all files are loaded.
 */

const API_KEY  = import.meta.env.VITE_GOOGLE_DRIVE_API_KEY;
const BASE_URL = 'https://www.googleapis.com/drive/v3/files';

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
 * Optimized Google Drive thumbnail helper.
 * Google Drive default thumbnails end in `=s220`.
 * Replacing `=s220` (or any `=s\d+` / `=w\d+`) with `=w${width}` provides
 * crisp, lightweight image previews without fetching multi-megabyte originals.
 */
export const getOptimizedThumbnail = (thumbnailLink, width = 600) => {
  if (!thumbnailLink) return null;
  if (/=[sw]\d+/.test(thumbnailLink)) {
    return thumbnailLink.replace(/=[sw]\d+.*$/, `=w${width}`);
  }
  return `${thumbnailLink}=w${width}`;
};

export const lhThumbnailUrl = (thumbnailLink, width = 1200) =>
  getOptimizedThumbnail(thumbnailLink, width);

// ─── Media type helpers ───────────────────────────────────────────────────────

export const isVideo = (mimeType = '') => mimeType.startsWith('video/');
export const isImage = (mimeType = '') => mimeType.startsWith('image/');

// ─── Pagination fetch ─────────────────────────────────────────────────────────

/**
 * Fetches ALL files from the Drive folder using a while-loop over nextPageToken.
 * @param {(count: number) => void} [onProgress] - Live progress callback
 * @param {string} [folderId] - Override folder ID (falls back to env var)
 * @returns {Promise<Array>} Unified array of all mapped media files
 */
export async function fetchAllDriveMedia(onProgress, folderId) {
  const targetFolder = folderId || import.meta.env.VITE_GOOGLE_DRIVE_FOLDER_ID;

  if (!targetFolder || !API_KEY) {
    throw new Error(
      'Missing Google Drive Folder ID or VITE_GOOGLE_DRIVE_API_KEY in your .env file.'
    );
  }

  const allFiles = [];
  let pageToken  = null;

  while (true) {
    const url = new URL(BASE_URL);
    url.searchParams.set('q',         `'${targetFolder}' in parents and trashed = false`);
    url.searchParams.set('key',        API_KEY);
    url.searchParams.set('pageSize',  '100');
    url.searchParams.set(
      'fields',
      'nextPageToken, files(id, name, mimeType, thumbnailLink, size, createdTime, imageMediaMetadata)'
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

      // Safe fallback for thumbnail: if Google Drive didn't generate thumbnailLink,
      // fallback to direct alt=media endpoint using API key
      const imgSrc = file.thumbnailLink
        ? (file.thumbnailLink.includes('=s220')
            ? file.thumbnailLink.replace('=s220', '=w600')
            : file.thumbnailLink.replace(/=[sw]\d+.*$/, '=w600'))
        : `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media&key=${API_KEY}`;

      const lightboxThumb = file.thumbnailLink
        ? file.thumbnailLink.replace(/=[sw]\d+.*$/, '=w1600')
        : imgSrc;

      allFiles.push({
        id:            file.id,
        name:          file.name,
        mimeType:      file.mimeType,
        size:          file.size ? formatBytes(file.size) : null,
        createdTime:   file.createdTime ?? null,
        metadata:      file.imageMediaMetadata ?? null,
        imgSrc:        imgSrc,
        thumbnailLink: imgSrc,
        // Resolved URLs
        viewUrl:       isImage(file.mimeType) ? viewUrl(file.id)    : null,
        previewUrl:    isVideo(file.mimeType) ? previewUrl(file.id) : null,
        downloadUrl:   downloadUrl(file.id),
        lhPreview:     lightboxThumb,
        isVideo:       isVideo(file.mimeType),
        isImage:       isImage(file.mimeType),
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
