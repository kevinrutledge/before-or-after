import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authRequest } from "../utils/apiClient";
import ImageUpload from "./ImageUpload";

// Update card with optional image replacement
const updateCard = async (cardId, formData, selectedFile) => {
  const form = new FormData();

  // Add form fields
  Object.entries(formData).forEach(([key, value]) => {
    form.append(key, value);
  });

  // Add image file only if new one selected
  if (selectedFile) {
    form.append("image", selectedFile);
  }

  return await authRequest(`/api/admin/cards/${cardId}`, {
    method: "PUT",
    body: form,
    headers: {} // Let browser set content-type for FormData
  });
};

function EditCardForm({ card, onClose }) {
  const [formData, setFormData] = useState({
    title: card.title || "",
    year: card.year || "",
    month: card.month || "",
    category: (card.category || "").trim(),
    sourceUrl: card.sourceUrl || "",
    cropMode: "scale"
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadError, setUploadError] = useState("");
  const queryClient = useQueryClient();

  // Update card mutation
  const updateMutation = useMutation({
    mutationFn: ({ cardId, formData, selectedFile }) =>
      updateCard(cardId, formData, selectedFile),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-cards"] });
      onClose();
    },
    onError: (error) => {
      console.error("Update failed:", error);
      setUploadError(error.message || "Failed to update card");
    }
  });

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle file selection
  const handleFileSelect = (file) => {
    setSelectedFile(file);
    setUploadError("");
  };

  // Handle upload error from ImageUpload
  const handleUploadError = (error) => {
    setUploadError(error);
    setSelectedFile(null);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploadError("");

    // Validate required fields (image is optional for updates)
    if (
      !formData.title ||
      !formData.year ||
      !formData.month ||
      !formData.category ||
      !formData.sourceUrl
    ) {
      setUploadError("All text fields are required");
      return;
    }

    updateMutation.mutate({
      cardId: card._id,
      formData,
      selectedFile
    });
  };

  return (
    <div className="admin-card-form">
      <h2>Edit Card</h2>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">Title</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="year">Year</label>
            <input
              type="number"
              id="year"
              name="year"
              min="1000"
              max="2030"
              value={formData.year}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="month">Month</label>
            <select
              id="month"
              name="month"
              value={formData.month}
              onChange={handleInputChange}
              required>
              <option value="">Select month</option>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(0, i).toLocaleString("default", { month: "long" })}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="category">Category</label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            required>
            <option value="">Select category</option>
            <option value="movie">Movie</option>
            <option value="album">Album</option>
            <option value="game">Game</option>
            <option value="technology">Technology</option>
            <option value="art">Art</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="sourceUrl">Source URL</label>
          <input
            type="url"
            id="sourceUrl"
            name="sourceUrl"
            value={formData.sourceUrl}
            onChange={handleInputChange}
            placeholder="https://..."
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="cropMode">
            Image Fit (applies only when replacing image)
          </label>
          <select
            id="cropMode"
            name="cropMode"
            value={formData.cropMode}
            onChange={handleInputChange}>
            <option value="scale">Scale to Fit</option>
            <option value="crop">Crop to Fill</option>
          </select>
        </div>

        <div className="form-group">
          <label>
            Image{" "}
            {!selectedFile && "(current image will be kept if not replaced)"}
          </label>

          {/* Show current image if no new file selected */}
          {!selectedFile && card.imageUrl && (
            <div
              className="current-image-preview"
              style={{ marginBottom: "1rem" }}>
              <img
                src={card.thumbnailUrl || card.imageUrl}
                alt={card.title}
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

          {uploadError && <div className="error-message">{uploadError}</div>}
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
            {updateMutation.isPending ? "Updating Card..." : "Update Card"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditCardForm;
