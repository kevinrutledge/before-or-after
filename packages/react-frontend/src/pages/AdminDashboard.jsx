import { useState, useEffect } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient
} from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import { authRequest } from "../utils/apiClient";
import { useLossGifs } from "../hooks/useLossGifs";
import PageContainer from "../components/PageContainer";
import Modal from "../components/Modal";
import AdminCardForm from "../components/AdminCardForm";
import EditCardForm from "../components/EditCardForm";
import AdminCard from "../components/AdminCard";
import LossGifCard from "../components/LossGifCard";
import LossGifForm from "../components/LossGifForm";
import Background from "../components/Background";

/**
 * Fetch cards with pagination and optional search filtering.
 */
const fetchAdminCards = async ({ pageParam = null, queryKey }) => {
  const [, searchQuery] = queryKey;
  const params = new URLSearchParams();

  if (pageParam) params.append("cursor", pageParam);
  params.append("limit", "20");
  if (searchQuery) params.append("search", searchQuery);

  const response = await authRequest(`/api/admin/cards?${params}`);
  return {
    cards: response.cards || response,
    nextCursor:
      response.nextCursor ||
      (response.length === 20 ? response[response.length - 1]._id : null)
  };
};

/**
 * Delete card by ID.
 */
const deleteCard = async (cardId) => {
  return await authRequest(`/api/admin/cards/${cardId}`, {
    method: "DELETE"
  });
};

function AdminDashboard() {
  const [deleteDialog, setDeleteDialog] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editCard, setEditCard] = useState(null);
  const [editLossGif, setEditLossGif] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const queryClient = useQueryClient();

  // Debounce search query with 400ms delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Infinite query for cards with debounced search
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error
  } = useInfiniteQuery({
    queryKey: ["admin-cards", debouncedSearchQuery],
    queryFn: fetchAdminCards,
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: 60000,
    gcTime: 300000
  });

  // Loss GIFs query
  const {
    data: lossGifs,
    isLoading: lossGifsLoading,
    error: lossGifsError
  } = useLossGifs();

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteCard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-cards"] });
      setDeleteDialog(null);
    },
    onError: (error) => {
      console.error("Delete failed:", error);
    }
  });

  // Intersection observer for infinite scroll
  const { ref, inView } = useInView();

  // Auto-load more when scrolling and not searching
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage && !debouncedSearchQuery) {
      fetchNextPage();
    }
  }, [
    inView,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    debouncedSearchQuery
  ]);

  // Get all loaded cards
  const allCards = data?.pages.flatMap((page) => page.cards) ?? [];

  // Handle add card button
  const handleAddCard = () => {
    setShowAddModal(true);
  };

  // Handle close modals
  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditCard(null);
    setEditLossGif(null);
  };

  // Handle edit card
  const handleEditCard = (card) => {
    setEditCard(card);
  };

  // Handle edit loss GIF
  const handleEditLossGif = (lossGif) => {
    setEditLossGif(lossGif);
  };

  // Handle delete confirmation
  const confirmDelete = (card) => {
    setDeleteDialog(card);
  };

  // Execute delete
  const handleDelete = () => {
    if (deleteDialog) {
      deleteMutation.mutate(deleteDialog._id);
    }
  };

  // Clear search
  const handleClearSearch = () => setSearchQuery("");

  // Error state
  if (error && allCards.length === 0) {
    return (
      <PageContainer>
        <div className="admin-error">
          <p>Failed to load cards: {error.message}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </PageContainer>
    );
  }

  return (
    <div>
      <Background />
      <PageContainer>
        <div className="admin-dashboard">
          <header className="admin-header">
            <h1>Admin Dashboard</h1>
          </header>

          {/* Loss GIF Management Section - Fixed Categories */}
          <section style={{ marginBottom: "3rem" }}>
            <div className="admin-section-header">
              <h2 style={{ marginBottom: "2rem", color: "var(--text-color)" }}>
                Loss GIF Management
              </h2>
            </div>

            {lossGifsError && (
              <div className="admin-error">
                <p>Failed to load loss GIFs: {lossGifsError.message}</p>
              </div>
            )}

            {lossGifsLoading ? (
              <div className="admin-cards-grid">
                {Array(5)
                  .fill(0)
                  .map((_, i) => (
                    <div key={i} className="admin-card-skeleton">
                      <div className="skeleton-title"></div>
                      <div className="skeleton-image"></div>
                      <div className="skeleton-info"></div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="admin-cards-grid">
                {lossGifs
                  ?.sort((a, b) => a.streakThreshold - b.streakThreshold)
                  .map((lossGif) => (
                    <LossGifCard
                      key={lossGif._id}
                      lossGif={lossGif}
                      onEdit={handleEditLossGif}
                    />
                  ))}
              </div>
            )}

            {/* Display warning when not exactly 5 categories */}
            {lossGifs && lossGifs.length !== 5 && (
              <div
                style={{
                  textAlign: "center",
                  color: "var(--before-red)",
                  marginTop: "1rem",
                  fontSize: "0.9rem"
                }}>
                Expected 5 loss GIF categories, found {lossGifs.length}. Run
                initialization script.
              </div>
            )}
          </section>

          {/* Card Management Section */}
          <section>
            <div className="admin-section-header">
              <div className="admin-card-management-header">
                <h2 style={{ color: "var(--text-color)", margin: 0 }}>
                  Card Management
                </h2>

                {/* Search bar positioned on same line */}
                <div className="admin-card-search-container">
                  <div className="admin-search-bar-cards">
                    <svg
                      className="admin-search-icon"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2">
                      <circle cx="11" cy="11" r="8"></circle>
                      <path d="m21 21-4.35-4.35"></path>
                    </svg>
                    <input
                      type="text"
                      placeholder="Search by title, category, or year"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="admin-search-input-cards"
                    />
                    {searchQuery && (
                      <button
                        className="admin-search-clear-cards"
                        onClick={handleClearSearch}
                        aria-label="Clear search">
                        ×
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Loading skeleton for initial load */}
            {isLoading ? (
              <div className="admin-cards-grid">
                {Array(8)
                  .fill(0)
                  .map((_, i) => (
                    <div key={i} className="admin-card-skeleton">
                      <div className="skeleton-title"></div>
                      <div className="skeleton-image"></div>
                      <div className="skeleton-info"></div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="admin-cards-grid">
                {/* Add new card button */}
                <div className="admin-add-card">
                  <button
                    className="admin-add-card-button"
                    onClick={handleAddCard}>
                    <span className="admin-plus-icon">+</span>
                    <span>Add New Card</span>
                  </button>
                </div>

                {/* Display cards */}
                {allCards.map((card, index) => (
                  <AdminCard
                    key={card._id}
                    card={card}
                    onEdit={handleEditCard}
                    onDelete={confirmDelete}
                    ref={
                      !debouncedSearchQuery && index === allCards.length - 1
                        ? ref
                        : null
                    }
                  />
                ))}
              </div>
            )}

            {/* Loading more indicator - only show when not searching */}
            {isFetchingNextPage && !debouncedSearchQuery && (
              <div className="admin-loading-more">Loading more cards...</div>
            )}

            {/* No more cards message - only show when not searching */}
            {!hasNextPage && allCards.length > 0 && !debouncedSearchQuery && (
              <div className="admin-loading-more">No more cards to load</div>
            )}

            {/* Search results info */}
            {debouncedSearchQuery && (
              <div className="admin-loading-more">
                {allCards.length === 0
                  ? "No cards found matching your search"
                  : `Found ${allCards.length} card${allCards.length === 1 ? "" : "s"}`}
              </div>
            )}
          </section>

          {/* Add card modal */}
          <Modal isOpen={showAddModal} onClose={handleCloseModal}>
            <AdminCardForm onClose={handleCloseModal} />
          </Modal>

          {/* Edit card modal */}
          <Modal isOpen={!!editCard} onClose={handleCloseModal}>
            {editCard && (
              <EditCardForm card={editCard} onClose={handleCloseModal} />
            )}
          </Modal>

          {/* Edit loss GIF modal */}
          <Modal isOpen={!!editLossGif} onClose={handleCloseModal}>
            {editLossGif && (
              <LossGifForm lossGif={editLossGif} onClose={handleCloseModal} />
            )}
          </Modal>

          {/* Delete confirmation dialog */}
          {deleteDialog && (
            <div className="admin-delete-dialog-overlay">
              <div className="admin-delete-dialog">
                <h3>Delete Card</h3>
                <p>Delete &quot;{deleteDialog.title}&quot;?</p>
                <div className="admin-dialog-actions">
                  <button
                    className="admin-cancel-button"
                    onClick={() => setDeleteDialog(null)}
                    disabled={deleteMutation.isPending}>
                    Cancel
                  </button>
                  <button
                    className="admin-delete-confirm-button"
                    onClick={handleDelete}
                    disabled={deleteMutation.isPending}>
                    {deleteMutation.isPending ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </PageContainer>
    </div>
  );
}

export default AdminDashboard;
