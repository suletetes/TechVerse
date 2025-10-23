/**
 * Query Hooks Index
 * Central export for all TanStack Query hooks
 */

// Auth queries
export {
  useMe,
  useSession,
  useLogin,
  useRegister,
  useLogout,
  useUpdateProfile,
  useChangePassword,
  useForgotPassword,
  useResetPassword,
  useRefreshSession,
  useVerifyEmail,
  useResendVerification,
} from './useAuthQueries.js';

// Product queries
export {
  useProducts,
  useInfiniteProducts,
  useProduct,
  useProductSearch,
  useCategories,
  useFeaturedProducts,
  useProductRecommendations,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  useUploadProductImages,
  useAddProductReview,
  usePrefetchProduct,
} from './useProductQueries.js';

// Cart queries
export {
  useCart,
  useCartCount,
  useAddToCart,
  useUpdateCartItem,
  useRemoveFromCart,
  useClearCart,
  useSyncCart,
} from './useCartQueries.js';

// Re-export query client utilities
export {
  queryClient,
  queryKeys,
  optimisticUpdates,
  invalidateQueries,
  backgroundRefetch,
  prefetchQueries,
  queryUtils,
} from '../../lib/queryClient.js';