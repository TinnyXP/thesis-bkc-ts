// src/lib/sanity/index.ts

// Export client
export { client, defaultRevalidateOptions, fastRevalidateOptions } from './client';

// Export schemas
export type { Post, Category, Author, SanityConfig, RevalidateOptions } from './schema';

// Export image utilities
export { urlFor, getThumbnailUrl, getOriginalImageUrl } from './image';

// Export queries and functions
export {
  POSTS_QUERY,
  CATEGORY_POSTS_QUERY,
  POST_QUERY,
  CATEGORY_QUERY,
  ALL_CATEGORIES_QUERY,
  getLatestPosts,
  getPostsByCategory,
  getPostBySlug,
  getCategoryBySlug,
  getAllCategories
} from './queries';

// Export helpers
export {
  formatThaiDate,
  groupPostsByCategory,
  createPostMetadata,
  setDefaultCategory,
  getRelatedPosts,
  shuffleArray
} from './helpers';