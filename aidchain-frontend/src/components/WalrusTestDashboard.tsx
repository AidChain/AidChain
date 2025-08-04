'use client';

import { useState } from 'react';

interface UploadResult {
  blobId?: string;
  quiltId?: string;
  patches?: Array<{ identifier: string; quiltPatchId: string }>;
  cost?: number;
  size?: number;
  error?: string;
}

interface FetchedBlobData {
  blob: Blob;
  contentType: string;
  size: number;
  isImage: boolean;
  isText: boolean;
  isVideo: boolean;
  textContent?: string;
  imageUrl?: string;
  videoUrl?: string;
  detectedType: string;
}

export default function WalrusTestDashboard() {
  // Single file upload states
  const [singleFile, setSingleFile] = useState<File | null>(null);
  const [singleUploading, setSingleUploading] = useState(false);
  const [singleResult, setSingleResult] = useState<UploadResult | null>(null);

  // Multiple files upload states
  const [multipleFiles, setMultipleFiles] = useState<FileList | null>(null);
  const [multipleUploading, setMultipleUploading] = useState(false);
  const [multipleResults, setMultipleResults] = useState<UploadResult | null>(null);

  // Fetch states - UPDATED
  const [fetchBlobId, setFetchBlobId] = useState<string>('');
  const [fetchedData, setFetchedData] = useState<FetchedBlobData | null>(null);
  const [fetching, setFetching] = useState(false);

  // Global error states, different than individual upload errors in UploadResult
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Single file upload handler
  const handleSingleUpload = async () => {
    if (!singleFile) return;

    setSingleUploading(true);
    setGlobalError(null);
    setSingleResult(null);

    try {
      const formData = new FormData();
      formData.append('file', singleFile);
      formData.append('epochs', '5');

      const response = await fetch('/api/walrus/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setSingleResult({
          blobId: data.data.newlyCreated?.blobObject.blobId || data.data.alreadyCertified?.blobId,
          cost: data.data.newlyCreated?.cost,
          size: data.data.newlyCreated?.blobObject.size,
        });
      } else {
        setSingleResult({
          error: data.error || 'Error occurred during single file upload, something wrong in the blob contract.',
        });
      }
    } catch (err) {
      setSingleResult({
        error: 'Single upload failed - Network error or server issue.',
      });
      console.error(err);
    } finally {
      setSingleUploading(false);
    }
  };

  // Multiple files upload handler
  const handleMultipleUpload = async () => {
    if (!multipleFiles || multipleFiles.length === 0) return;

    setMultipleUploading(true);
    setGlobalError(null);
    setMultipleResults(null);

    try {
      const formData = new FormData();

      // Add each file with a unique identifier
      Array.from(multipleFiles).forEach((file, index) => {
        const identifier = `file-${index}-${file.name.split('.')[0]}`;
        formData.append(identifier, file);
      });

      formData.append('epochs', '5');

      const response = await fetch('/api/walrus/quilt', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setMultipleResults({
          quiltId: data.data.blobStoreResult.newlyCreated?.blobObject.blobId,
          patches: data.data.storedQuiltBlobs,
          cost: data.data.blobStoreResult.newlyCreated?.cost,
          size: data.data.blobStoreResult.newlyCreated?.blobObject.size,
        });
      } else {
        setMultipleResults({
          error: data.error || 'Quilt upload failed, something wrong in the blob contract.',
        });
      }
    } catch (err) {
      setMultipleResults({
        error: 'Multiple upload failed - Network error or server issue.',
      });
      console.error(err);
    } finally {
      setMultipleUploading(false);
    }
  };

  // NEW: Enhanced file type detection based on your Python discovery
  const detectFileTypeFromHeader = (arrayBuffer: ArrayBuffer): {
    mimeType: string;
    extension: string;
    isImage: boolean;
    isText: boolean;
    isVideo: boolean;
    detectedType: string;
  } => {
    const uint8Array = new Uint8Array(arrayBuffer);
    const header16 = uint8Array.slice(0, 16);
    
    // Convert first 16 bytes to ASCII string (ignoring errors like Python)
    const headerAscii = Array.from(header16)
      .map(byte => byte >= 32 && byte <= 126 ? String.fromCharCode(byte) : ' ')
      .join('')
      .trim();

    console.log('Header ASCII:', headerAscii);
    console.log('Header hex:', Array.from(header16).map(b => b.toString(16).padStart(2, '0')).join(''));

    // WebP detection: "RIFFWEBPVP8"
    if (headerAscii.includes('RIFF') && headerAscii.includes('WEBP')) {
      return {
        mimeType: 'image/webp',
        extension: '.webp',
        isImage: true,
        isText: false,
        isVideo: false,
        detectedType: 'WebP Image (RIFF container)'
      };
    }

    // MP4 detection: "ftypisom"
    if (headerAscii.includes('ftyp')) {
      return {
        mimeType: 'video/mp4',
        extension: '.mp4',
        isImage: false,
        isText: false,
        isVideo: true,
        detectedType: 'MP4 Video (ftyp header)'
      };
    }

    // JPEG detection: "ExifMM*" or traditional JPEG headers
    if (headerAscii.includes('Exif') || 
        (uint8Array[0] === 0xFF && uint8Array[1] === 0xD8 && uint8Array[2] === 0xFF)) {
      return {
        mimeType: 'image/jpeg',
        extension: '.jpg',
        isImage: true,
        isText: false,
        isVideo: false,
        detectedType: 'JPEG Image (Exif or JFIF)'
      };
    }

    // PNG detection (traditional)
    if (uint8Array[0] === 0x89 && uint8Array[1] === 0x50 && 
        uint8Array[2] === 0x4E && uint8Array[3] === 0x47) {
      return {
        mimeType: 'image/png',
        extension: '.png',
        isImage: true,
        isText: false,
        isVideo: false,
        detectedType: 'PNG Image'
      };
    }

    // GIF detection
    if (headerAscii.startsWith('GIF8')) {
      return {
        mimeType: 'image/gif',
        extension: '.gif',
        isImage: true,
        isText: false,
        isVideo: false,
        detectedType: 'GIF Image'
      };
    }

    // JSON detection
    const textStart = headerAscii.trim();
    if (textStart.startsWith('{') || textStart.startsWith('[')) {
      return {
        mimeType: 'application/json',
        extension: '.json',
        isImage: false,
        isText: true,
        isVideo: false,
        detectedType: 'JSON Data'
      };
    }

    // Plain text detection (check if mostly printable ASCII)
    const printableCount = Array.from(uint8Array.slice(0, 100))
      .filter(byte => (byte >= 32 && byte <= 126) || byte === 9 || byte === 10 || byte === 13)
      .length;
    
    if (printableCount > 80) { // 80% printable characters
      return {
        mimeType: 'text/plain',
        extension: '.txt',
        isImage: false,
        isText: true,
        isVideo: false,
        detectedType: 'Plain Text'
      };
    }

    // Default: binary file
    return {
      mimeType: 'application/octet-stream',
      extension: '.bin',
      isImage: false,
      isText: false,
      isVideo: false,
      detectedType: 'Binary Data'
    };
  };

  // UPDATED: Enhanced fetch blob data with proper binary decoding
  const handleFetchBlob = async () => {
    if (!fetchBlobId.trim()) return;

    setFetching(true);
    setGlobalError(null);
    setFetchedData(null);

    try {
      const response = await fetch(`/api/walrus/blob/${fetchBlobId.trim()}`);

      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        
        // Detect file type from binary data
        const fileInfo = detectFileTypeFromHeader(arrayBuffer);
        
        // Create blob with correct MIME type
        const blob = new Blob([arrayBuffer], { type: fileInfo.mimeType });

        let textContent: string | undefined;
        let imageUrl: string | undefined;
        let videoUrl: string | undefined;

        // Handle different file types
        if (fileInfo.isImage) {
          // For images, create object URL directly from the raw binary data
          imageUrl = URL.createObjectURL(blob);
        } else if (fileInfo.isVideo) {
          // For videos, create object URL directly from the raw binary data
          videoUrl = URL.createObjectURL(blob);
        } else if (fileInfo.isText && arrayBuffer.byteLength < 1024 * 1024) { // Only show text preview for files < 1MB
          try {
            textContent = new TextDecoder('utf-8').decode(arrayBuffer);
            // Double-check if it's actually readable text
            const isBinary = /[\x00-\x08\x0E-\x1F\x7F-\xFF]/.test(textContent.substring(0, 1000));
            if (isBinary) {
              textContent = undefined;
            }
          } catch {
            textContent = undefined;
          }
        }

        setFetchedData({
          blob,
          contentType: fileInfo.mimeType,
          size: arrayBuffer.byteLength,
          isImage: fileInfo.isImage,
          isText: !!textContent,
          isVideo: fileInfo.isVideo,
          textContent,
          imageUrl,
          videoUrl,
          detectedType: fileInfo.detectedType
        });
      } else {
        const errorData = await response.json();
        setGlobalError(errorData.error || 'Failed to fetch blob data.');
      }
    } catch (err) {
      setGlobalError('Fetch failed - Network error or server issue.');
      console.error(err);
    } finally {
      setFetching(false);
    }
  };

  // UPDATED: Download single blob with proper file extension
  const handleDownloadBlob = () => {
    if (!fetchedData) return;

    const link = document.createElement('a');
    link.href = URL.createObjectURL(fetchedData.blob);
    
    // Use detected file extension
    const extension = getFileExtension(fetchedData.contentType);
    link.download = `walrus-blob-${fetchBlobId}${extension}`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  // UPDATED: Download all files from a quilt with better type detection
  const handleDownloadQuilt = async () => {
    if (!multipleResults?.patches) return;

    setGlobalError(null);
    
    try {
      for (const patch of multipleResults.patches) {
        const response = await fetch(`/api/walrus/blob/${patch.quiltPatchId}`);
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          const fileInfo = detectFileTypeFromHeader(arrayBuffer);
          const blob = new Blob([arrayBuffer], { type: fileInfo.mimeType });
          
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          
          // Use the original identifier with detected extension
          const filename = patch.identifier || `quilt-patch-${patch.quiltPatchId}`;
          link.download = `${filename}${fileInfo.extension}`;
          
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(link.href);
          
          // Small delay between downloads
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    } catch (error) {
      setGlobalError('Failed to download some files from the quilt');
      console.error(error);
    }
  };

  // Helper function to get file extension from content type
  const getFileExtension = (contentType: string): string => {
    const extensions: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/webp': '.webp',
      'image/svg+xml': '.svg',
      'text/plain': '.txt',
      'text/html': '.html',
      'text/css': '.css',
      'text/javascript': '.js',
      'application/json': '.json',
      'application/pdf': '.pdf',
      'application/zip': '.zip',
      'video/mp4': '.mp4',
      'audio/mpeg': '.mp3',
      'application/octet-stream': '.bin',
    };
    
    return extensions[contentType] || '.bin';
  };

  // Format file size helper
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold text-center text-gray-900 dark:text-white">
        Walrus Storage Test Dashboard
      </h1>

      {/* Global Error Display */}
      {globalError && (
        <div className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 border border-red-300 dark:border-red-700 p-4 rounded">
          <strong>Error:</strong> {globalError}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        {/* Single File Upload */}
        <div className='bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 rounded-lg shadow-md'>
          <h2 className='text-2xl font-semibold mb-4 text-gray-900 dark:text-white'>
            Single Blob Upload Tester
          </h2>

          <div className="space-y-4">
            <div>
              <label className='block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300'>
                Select a file:
              </label>
              <input
                type="file"
                onChange={(e) => setSingleFile(e.target.files?.[0] || null)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <button
              onClick={handleSingleUpload}
              disabled={!singleFile || singleUploading}
              className='w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 dark:disabled:bg-gray-600 text-white py-2 px-4 rounded disabled:cursor-not-allowed transition-colors'
            >
              {singleUploading ? 'Uploading...' : 'Upload Single File'}
            </button>

            {/* Single Upload Result Display */}
            {singleResult && (
              <div className={`mt-4 p-4 border rounded ${
                singleResult.error 
                  ? 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700 text-red-800 dark:text-red-200' 
                  : 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700 text-green-800 dark:text-green-200'
              }`}>
                {singleResult.error ? (
                  <div>
                    <h3 className='font-semibold'>Upload Failed!</h3>
                    <p className='text-sm mt-1'>{singleResult.error}</p>
                  </div>
                ) : (
                  <div>
                    <h3 className='font-semibold'>Upload Successful!</h3>
                    <div className='mt-2 text-sm space-y-1'>
                      <p>
                        <strong>Blob ID:</strong>
                        <code className='bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-gray-100 px-1 rounded ml-1'>
                          {singleResult.blobId}
                        </code>
                      </p>
                      {singleResult.size && <p><strong>Size:</strong> {formatFileSize(singleResult.size)}</p>}
                      {singleResult.cost && <p><strong>Cost:</strong> {singleResult.cost} FROST</p>}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Multiple Files Upload (Quilt)*/}
        <div className='bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 rounded-lg shadow-md'>
          <h2 className='text-2xl font-semibold mb-4 text-gray-900 dark:text-white'>
            Quilt Upload Tester (Multiple Files)
          </h2>
          <div className='space-y-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                Select Multiple Files
              </label>
              <input
                type='file'
                multiple
                onChange={(e) => setMultipleFiles(e.target.files)}
                className='w-full p-2 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
              />
            </div>

            <button
              onClick={handleMultipleUpload}
              disabled={!multipleFiles || multipleFiles.length === 0 || multipleUploading}
              className='w-full bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 dark:disabled:bg-gray-600 text-white py-2 px-4 rounded disabled:cursor-not-allowed transition-colors'
            >
              {multipleUploading ? 'Uploading...' : 'Upload Multiple Files'}
            </button>

            {/* Multiple Upload Result Display */}
            {multipleResults && (
              <div className={`mt-4 p-4 border rounded ${
                multipleResults.error 
                  ? 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700 text-red-800 dark:text-red-200'
                  : 'bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-700 text-purple-800 dark:text-purple-200'
              }`}>
                {multipleResults.error ? (
                  <div>
                    <h3 className='font-semibold'>Quilt Upload Failed!</h3>
                    <p className='text-sm mt-1'>{multipleResults.error}</p>
                  </div>
                ) : (
                  <div>
                    <h3 className='font-semibold'>Quilt Upload Successful!</h3>
                    <div className='mt-2 text-sm space-y-1'>
                      <p>
                        <strong>Quilt ID:</strong> 
                        <code className='bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-gray-100 px-1 rounded ml-1'>
                          {multipleResults.quiltId}
                        </code>
                      </p>
                      {multipleResults.cost && <p><strong>Cost:</strong> {multipleResults.cost} FROST</p>}
                      {multipleResults.patches && multipleResults.patches.length > 0 && (
                        <div>
                          <p><strong>Files ({multipleResults.patches.length}):</strong></p>
                          <ul className='ml-4 space-y-1'>
                            {multipleResults.patches.map((patch, index) => (
                              <li key={index} className='text-xs'>
                                <strong>{patch.identifier}:</strong> 
                                <code className='bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-gray-100 px-1 rounded ml-1'>
                                  {patch.quiltPatchId}
                                </code>
                              </li>
                            ))}
                          </ul>
                          <button
                            onClick={handleDownloadQuilt}
                            className='mt-2 bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-xs transition-colors'
                          >
                            📥 Download All Files
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* UPDATED: Enhanced Fetch Blob Data Section */}
      <div className='bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 rounded-lg shadow-md'>
        <h2 className='text-2xl font-semibold mb-4 text-gray-900 dark:text-white'>
          Fetch & Download Blob Data
        </h2>

        <div className='space-y-4'>
          <div>
            <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
              Blob ID
            </label>
            <input
              type='text'
              value={fetchBlobId}
              onChange={(e) => setFetchBlobId(e.target.value)}
              placeholder='Enter blob ID to fetch..'
              className='w-full p-2 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400'
            />
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={handleFetchBlob}
              disabled={!fetchBlobId.trim() || fetching}
              className='bg-green-500 hover:bg-green-600 disabled:bg-gray-400 dark:disabled:bg-gray-600 text-white py-2 px-4 rounded disabled:cursor-not-allowed transition-colors'
            >
              {fetching ? 'Fetching...' : '🔍 Fetch Blob'}
            </button>

            {fetchedData && (
              <button
                onClick={handleDownloadBlob}
                className='bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded transition-colors'
              >
                📥 Download
              </button>
            )}
          </div>

          {/* UPDATED: Enhanced fetched data display with video support */}
          {fetchedData && (
            <div className='mt-4 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded'>
              <div className="flex justify-between items-start mb-3">
                <h3 className='font-semibold text-green-800 dark:text-green-200'>
                  Fetched Data Successfully!
                </h3>
              </div>
              
              {/* Enhanced File Info */}
              <div className="mb-4 text-sm text-green-700 dark:text-green-300">
                <p><strong>Content Type:</strong> {fetchedData.contentType}</p>
                <p><strong>Size:</strong> {formatFileSize(fetchedData.size)}</p>
                <p><strong>Detected Type:</strong> {fetchedData.detectedType}</p>
              </div>

              {/* Image Preview */}
              {fetchedData.isImage && fetchedData.imageUrl && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-green-700 dark:text-green-300 mb-2">Image Preview:</p>
                  <img 
                    src={fetchedData.imageUrl} 
                    alt="Fetched blob content"
                    className="max-w-full max-h-64 rounded border border-gray-300 dark:border-gray-600"
                    onLoad={() => console.log('Image loaded successfully')}
                    onError={() => console.error('Failed to load image')}
                  />
                </div>
              )}

              {/* Video Preview */}
              {fetchedData.isVideo && fetchedData.videoUrl && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-green-700 dark:text-green-300 mb-2">Video Preview:</p>
                  <video 
                    src={fetchedData.videoUrl}
                    controls
                    className="max-w-full max-h-64 rounded border border-gray-300 dark:border-gray-600"
                    onLoad={() => console.log('Video loaded successfully')}
                    onError={() => console.error('Failed to load video')}
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
              )}

              {/* Text/JSON Preview */}
              {fetchedData.isText && fetchedData.textContent && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-green-700 dark:text-green-300 mb-2">
                    {fetchedData.contentType.includes('json') ? 'JSON Data Preview:' : 'Text Content Preview:'}
                  </p>
                  <pre className='bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 p-3 rounded text-sm overflow-auto max-h-64 whitespace-pre-wrap'>
                    {fetchedData.textContent.length > 2000 
                      ? fetchedData.textContent.substring(0, 2000) + '\n...(truncated - download to see full content)'
                      : fetchedData.textContent
                    }
                  </pre>
                </div>
              )}

              {/* Binary File Notice */}
              {!fetchedData.isImage && !fetchedData.isText && !fetchedData.isVideo && (
                <div className="mb-4">
                  <p className="text-sm text-green-700 dark:text-green-300">
                    📄 Binary file detected. Click download to save the file to your computer.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Quick Copy Section for Blob ID*/}
      {((singleResult?.blobId && !singleResult.error) || (multipleResults?.quiltId && !multipleResults.error)) && (
        <div className='bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-lg'>
          <h3 className='font-semibold mb-2 text-gray-900 dark:text-white'>
            Quick Copy Blob ID for Testing:
          </h3>
          <div className='space-y-2 text-sm'>
            {singleResult?.blobId && !singleResult.error && (
              <div className="text-gray-700 dark:text-gray-300">
                <span className='font-medium'>Single Blob ID:</span>
                <button
                  onClick={() => setFetchBlobId(singleResult.blobId || '')}
                  className='ml-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline'
                >
                  Copy to Fetch
                </button>
                <code className='ml-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 px-2 py-1 rounded text-xs'>
                  {singleResult.blobId}
                </code>
              </div>
            )}
            {multipleResults?.quiltId && !multipleResults.error && (
              <div className="text-gray-700 dark:text-gray-300">
                <span className='font-medium'>Quilt Blob ID (Multiple Files):</span>
                <button
                  onClick={() => setFetchBlobId(multipleResults.quiltId || '')}
                  className='ml-2 text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 underline'
                >
                  Copy to Fetch
                </button>
                <code className='ml-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 px-2 py-1 rounded text-xs'>
                  {multipleResults.quiltId}
                </code>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}