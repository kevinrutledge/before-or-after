import { useState } from "react";
import { useUpdateLossGif } from "../hooks/useLossGifs";
import ImageUpload from "./ImageUpload";

/**
 * Edit loss GIF modal form component.
 * Updates GIF images for streak threshold categories.
 */
function LossGifForm({ lossGif, onClose }) {
  const [formData, setFormData] = useState({
    category: lossGif.category || "",
    scoreRange: lossGif.scoreRange || "",
    streakThreshold: lossGif.streakThreshold || ""
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadError, setUploadError] = useState("");

  const updateMutation = useUpdateLossGif();

  /**
   * Handle form input changes for text fields.
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const newFormData = { ...formData, [name]: value };
    setFormData(newFormData);
  };

  /**
   * Handle file selection from ImageUpload component.
   */
  const handleFileSelect = (file) => {
    setSelectedFile(file);
    setUploadError("");
  };

  /**
   * Handle upload error from ImageUpload component.
   */
  const handleUploadError = (error) => {
    setUploadError(error);
    setSelectedFile(null);
  };

  /**
   * Handle form submission and update loss GIF.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploadError("");

    // Validate required fields with proper trimming
    const { category, scoreRange, streakThreshold } = formData;
    const trimmedCategory = (category || "").trim();
    const trimmedScoreRange = (scoreRange || "").trim();

    if (!trimmedCategory || !streakThreshold || !trimmedScoreRange) {
      const errorMsg = "All fields are required";
      setUploadError(errorMsg);
      return;
    }

    // Call mutation with payload
    const mutationPayload = {
      lossGifId: lossGif._id,
      formData,
      selectedFile
    };

    updateMutation.mutate(mutationPayload, {
      onSuccess: () => {
        onClose();
      },
      onError: (error) => {
        setUploadError(error.message || "Failed to update loss GIF");
      }
    });
  };

  return (
    <div className="admin-card-form">
      <h2>Edit Loss GIF</h2>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="category">Category</label>
          <input
            type="text"
            id="category"
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="scoreRange">Score Range</label>
          <input
            type="text"
            id="scoreRange"
            name="scoreRange"
            value={formData.scoreRange}
            onChange={handleInputChange}
            placeholder="< 2, 2 - 4, ≥ 12, etc."
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="streakThreshold">Streak Threshold</label>
          <input
            type="number"
            id="streakThreshold"
            name="streakThreshold"
            min="0"
            value={formData.streakThreshold}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label>
            New Image
            {!selectedFile && " (current image will be kept if not replaced)"}
          </label>

          {/* Show current image preview when no new file selected */}
          {!selectedFile && lossGif.imageUrl && (
            <div
              className="current-image-preview"
              style={{ marginBottom: "1rem" }}>
              <img
                src={lossGif.thumbnailUrl || lossGif.imageUrl}
                alt={lossGif.category}
                style={{
                  width: "150px",
                  height: "auto",
                  borderRadius: "4px",
                  border: "1px solid #ddd"
                }}
              />
              <p
                style={{
                  fontSize: "0.875rem",
                  color: "#666",
                  marginTop: "0.5rem"
                }}>
                Current image
              </p>
            </div>
          )}

          <ImageUpload
            onFileSelect={handleFileSelect}
            onError={handleUploadError}
            selectedFile={selectedFile}
          />

          {uploadError && (
            <div className="error-message" data-testid="error-message">
              {uploadError}
            </div>
          )}
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="cancel-button"
            onClick={onClose}
            disabled={updateMutation.isPending}>
            Cancel
          </button>
          <button
            type="submit"
            className="submit-button"
            disabled={updateMutation.isPending}>
            {updateMutation.isPending ? "Updating..." : "Update Loss GIF"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default LossGifForm;
