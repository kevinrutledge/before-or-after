import { useState, useRef } from "react";

function ImageUpload({ onFileSelect, onError, selectedFile }) {
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  // Handle file selection - preview only, no upload
  const handleFileSelect = (file) => {
    if (!file) return;

    // Validate file type - NOW INCLUDES GIF
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      onError("Invalid file type. Only JPEG, PNG, WebP, and GIF allowed");
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      onError("File too large. Maximum size is 10MB");
      return;
    }

    // Show preview and notify parent
    const reader = new FileReader();
    reader.onload = (e) => setPreviewUrl(e.target.result);
    reader.readAsDataURL(file);

    // Pass file to parent component
    onFileSelect(file);
  };

  // Handle drag events
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Handle drop
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  // Handle click to open file picker
  const handleClick = () => {
    if (!selectedFile) {
      fileInputRef.current?.click();
    }
  };

  // Handle file input change
  const handleInputChange = (e) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  // Clear selection
  const handleClear = (e) => {
    e.stopPropagation();
    setPreviewUrl(null);
    onFileSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="image-upload">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleInputChange}
        style={{ display: "none" }}
      />

      <div
        className={`upload-zone ${dragActive ? "drag-active" : ""}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleClick}>
        {previewUrl ? (
          <div className="preview-container">
            <img src={previewUrl} alt="Preview" className="preview-image" />
            <div className="preview-overlay">
              <button
                type="button"
                onClick={handleClear}
                className="clear-button"
                style={{
                  position: "absolute",
                  top: "8px",
                  right: "8px",
                  background: "rgba(0,0,0,0.7)",
                  color: "white",
                  border: "none",
                  borderRadius: "50%",
                  width: "24px",
                  height: "24px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                ×
              </button>
            </div>
          </div>
        ) : (
          <div className="upload-prompt">
            <div
              className="upload-icon"
              style={{
                color: "#9ca3af",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                marginBottom: "1rem"
              }}>
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="9" cy="9" r="2" />
                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
              </svg>
            </div>
            <p className="upload-text">Click or drag image here</p>
            <p className="upload-hint">JPEG, PNG, WebP, or GIF • Max 10MB</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ImageUpload;
