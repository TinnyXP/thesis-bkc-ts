// src/lib/sanity/index.ts

// Export client
export { client, defaultRevalidateOptions, fastRevalidateOptions } from './client';

// Export schemas
export type { 
  Post, Category, Author, SanityConfig, RevalidateOptions, 
  // เพิ่ม types สำหรับสถานที่ท่องเที่ยว
  Place, PlaceType, District, GeoPoint, ContactInfo, 
  OperatingHour, PricingItem
} from './schema';

// Export image utilities
export { urlFor, getThumbnailUrl, getOriginalImageUrl } from './image';

// Export queries and functions for blog/post
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

// Export queries and functions for places
export {
  PLACES_QUERY,
  PLACE_TYPE_QUERY,
  DISTRICT_PLACES_QUERY,
  PLACE_QUERY,
  ALL_PLACE_TYPES_QUERY,
  ALL_DISTRICTS_QUERY,
  getLatestPlaces,
  getPlacesByType,
  getPlacesByDistrict,
  getPlaceBySlug,
  getAllPlaceTypes,
  getAllDistricts
} from './placeQueries';

// Export place metadata helpers
export {
  createPlaceMetadata
} from './placeMetadata';

// Export blog helpers
export {
  formatThaiDate,
  groupPostsByCategory,
  createPostMetadata,
  setDefaultCategory,
  getRelatedPosts,
  shuffleArray
} from './helpers';