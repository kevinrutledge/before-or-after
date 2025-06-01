import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authRequest } from "../utils/apiClient";

/**
 * Fetch loss GIFs from API endpoint.
 */
const fetchLossGifs = async () => {
  return await authRequest("/api/admin/loss-gifs");
};

/**
 * Update existing loss GIF with new image data.
 */
const updateLossGif = async (lossGifId, formData, selectedFile) => {
  const form = new FormData();

  // Add form fields
  Object.entries(formData).forEach(([key, value]) => {
    form.append(key, value);
  });

  // Add image file when provided
  if (selectedFile) {
    form.append("image", selectedFile);
  }

  return await authRequest(`/api/admin/loss-gifs/${lossGifId}`, {
    method: "PUT",
    body: form,
    headers: {} // Let browser set content-type for FormData
  });
};

/**
 * React Query hook for loss GIF management operations.
 * Provides fetching and update capabilities for admin interface.
 */
export const useLossGifs = () => {
  return useQuery({
    queryKey: ["admin-loss-gifs"],
    queryFn: fetchLossGifs,
    staleTime: 60000,
    gcTime: 300000
  });
};

/**
 * Mutation hook for updating loss GIF images.
 * Invalidates cache after successful update.
 */
export const useUpdateLossGif = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ lossGifId, formData, selectedFile }) => {
      return updateLossGif(lossGifId, formData, selectedFile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-loss-gifs"] });
    }
  });
};
