import { useState, useEffect } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient
} from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import { authRequest } from "../utils/apiClient";
import Layout from "../components/Layout";
import PageContainer from "../components/PageContainer";
import Modal from "../components/Modal";
import AdminCardForm from "../components/AdminCardForm";
import EditCardForm from "../components/EditCardForm";
import AdminCard from "../components/AdminCard";

// Fetch cards with pagination
const fetchAdminCards = async ({ pageParam = null }) => {
  const params = pageParam ? `?cursor=${pageParam}&limit=20` : "?limit=20";
  const response = await authRequest(`/api/admin/cards${params}`);
  return {
    cards: response.cards || response,
    nextCursor:
      response.nextCursor ||
      (response.length === 20 ? response[response.length - 1]._id : null)
  };
};

// Delete card
const deleteCard = async (cardId) => {
  return await authRequest(`/api/admin/cards/${cardId}`, {
    method: "DELETE"
  });
};

function AdminDashboard() {
  const [deleteDialog, setDeleteDialog] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editCard, setEditCard] = useState(null);
  const queryClient = useQueryClient();

  // Infinite query for cards
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error
  } = useInfiniteQuery({
    queryKey: ["admin-cards"],
    queryFn: fetchAdminCards,
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: 60000,
    gcTime: 300000
  });

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

  // Auto-load more when scrolling
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Get all loaded cards
  const allCards = data?.pages.flatMap((page) => page.cards) ?? [];

  // Handle add card button
  const handleAddCard = () => {
    setShowAddModal(true);
  };

  // Handle close modal
  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditCard(null);
  };

  // Handle edit card
  const handleEditCard = (card) => {
    setEditCard(card);
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

  // Error state
  if (error && allCards.length === 0) {
    return (
      <Layout>
        <PageContainer>
          <div className="admin-error">
            <p>Failed to load cards: {error.message}</p>
            <button onClick={() => window.location.reload()}>Retry</button>
          </div>
        </PageContainer>
      </Layout>
    );
  }

  return (
    <Layout>
      <PageContainer>
        <div className="admin-dashboard">
          <header className="admin-header">
            <h1>Card Management</h1>
          </header>

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

              {/* Existing cards */}
              {allCards.map((card, index) => (
                <AdminCard
                  key={card._id}
                  card={card}
                  onEdit={handleEditCard}
                  onDelete={confirmDelete}
                  ref={index === allCards.length - 1 ? ref : null}
                />
              ))}
            </div>
          )}

          {/* Loading more indicator */}
          {isFetchingNextPage && (
            <div className="admin-loading-more">Loading more cards...</div>
          )}

          {/* No more cards message */}
          {!hasNextPage && allCards.length > 0 && (
            <div className="admin-loading-more">No more cards to load</div>
          )}

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
    </Layout>
  );
}

export default AdminDashboard;
