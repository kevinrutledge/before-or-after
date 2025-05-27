/**
 * Parse multipart form data for file uploads and text fields.
 * Extracts files and form fields from multipart/form-data requests.
 */
export function parseMultipartData(bodyBuffer, contentType) {
  const boundary = contentType.split("boundary=")[1];
  if (!boundary) return null;

  const boundaryBuffer = Buffer.from(`--${boundary}`);
  const files = {};
  const fields = {};

  // Split on boundary markers using buffer operations
  let start = 0;
  let boundaryIndex = bodyBuffer.indexOf(boundaryBuffer, start);

  while (boundaryIndex !== -1) {
    const nextBoundaryIndex = bodyBuffer.indexOf(
      boundaryBuffer,
      boundaryIndex + boundaryBuffer.length
    );
    if (nextBoundaryIndex === -1) break;

    // Extract this part as buffer
    const partBuffer = bodyBuffer.slice(
      boundaryIndex + boundaryBuffer.length,
      nextBoundaryIndex
    );

    // Find headers section (ends with \r\n\r\n)
    const headerEnd = partBuffer.indexOf(Buffer.from("\r\n\r\n"));
    if (headerEnd === -1) {
      boundaryIndex = nextBoundaryIndex;
      continue;
    }

    const headersBuffer = partBuffer.slice(0, headerEnd);
    const contentBuffer = partBuffer.slice(headerEnd + 4);

    // Parse headers as string
    const headers = headersBuffer.toString("utf8");
    const dispositionMatch = headers.match(
      /Content-Disposition: form-data; name="([^"]+)"(?:; filename="([^"]+)")?/
    );

    if (!dispositionMatch) {
      boundaryIndex = nextBoundaryIndex;
      continue;
    }

    const fieldName = dispositionMatch[1];
    const filename = dispositionMatch[2];

    if (filename) {
      // File field - keep as pure binary buffer
      const contentTypeMatch = headers.match(/Content-Type: ([^\r\n]+)/);
      const mimeType = contentTypeMatch
        ? contentTypeMatch[1]
        : "application/octet-stream";

      // Remove trailing \r\n from content buffer
      let finalBuffer = contentBuffer;
      if (
        finalBuffer.length >= 2 &&
        finalBuffer[finalBuffer.length - 2] === 13 &&
        finalBuffer[finalBuffer.length - 1] === 10
      ) {
        finalBuffer = finalBuffer.slice(0, -2);
      }

      files[fieldName] = {
        fieldname: fieldName,
        originalname: filename,
        mimetype: mimeType,
        buffer: finalBuffer,
        size: finalBuffer.length
      };
    } else {
      // Text field - convert to string and trim
      const textContent = contentBuffer.toString("utf8");
      fields[fieldName] = textContent.replace(/\r\n$/, "").trim();
    }

    boundaryIndex = nextBoundaryIndex;
  }

  return { files, fields };
}
