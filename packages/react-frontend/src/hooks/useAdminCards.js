import { useInfiniteQuery } from "@tanstack/react-query";
import { authRequest } from "../utils/apiClient";

export const useAdminCards = () => {
  return useInfiniteQuery({
    queryKey: ["admin-cards"],
    queryFn: ({ pageParam = null }) => fetchAdminCards(pageParam),
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: 60000,
    gcTime: 300000
  });
};

const fetchAdminCards = async (cursor) => {
  const params = cursor ? `?cursor=${cursor}&limit=20` : "?limit=20";
  return await authRequest(`/api/admin/cards${params}`);
};
