// src/lib/sanity/placeQueries.ts
import { client } from './client';
import { defaultRevalidateOptions } from './client';
import { Place, PlaceType, District } from './schema';

/**
 * Query สำหรับดึงสถานที่ท่องเที่ยวทั้งหมด
 */
export const PLACES_QUERY = `*[
  _type == "place" && defined(slug.current)
] | order(coalesce(updatedAt, publishedAt) desc) {
  _id,
  title,
  slug,
  description,
  publishedAt,
  "placeType": placeType->{
    title,
    slug,
    icon
  },
  "district": district->{
    title,
    slug
  },
  mainImage {
    asset->{
      url,
      metadata { 
        lqip, 
        dimensions 
      }
    }
  }
}`;

/**
 * Query สำหรับดึงสถานที่ท่องเที่ยวตามประเภท
 */
export const PLACE_TYPE_QUERY = `*[
  _type == "place" && 
  defined(slug.current) &&
  placeType->slug.current == $placeType
] | order(publishedAt desc) {
  _id,
  title,
  slug,
  description,
  publishedAt,
  "placeType": placeType->{
    title,
    slug,
    icon
  },
  "district": district->{
    title,
    slug
  },
  mainImage {
    asset-> {
      _ref,
      url
    }
  }
}`;

/**
 * Query สำหรับดึงสถานที่ท่องเที่ยวตามตำบล/พื้นที่
 */
export const DISTRICT_PLACES_QUERY = `*[
  _type == "place" && 
  defined(slug.current) &&
  district->slug.current == $district
] | order(publishedAt desc) {
  _id,
  title,
  slug,
  description,
  publishedAt,
  "placeType": placeType->{
    title,
    slug,
    icon
  },
  "district": district->{
    title,
    slug
  },
  mainImage {
    asset-> {
      _ref,
      url
    }
  }
}`;

/**
 * Query สำหรับดึงข้อมูลสถานที่ท่องเที่ยวเดียว
 */
export const PLACE_QUERY = `*[_type == "place" && slug.current == $slug][0] {
  _id,
  title,
  slug,
  description,
  body,
  publishedAt,
  updatedAt,
  "placeType": placeType->{
    title,
    slug,
    icon
  },
  "district": district->{
    title,
    slug
  },
  location,
  address,
  contactInfo,
  operatingHours,
  pricing,
  facilities,
  activities,
  bestTimeToVisit,
  tags,
  mainImage {
    asset-> {
      _ref,
      url
    }
  },
  gallery[] {
    asset-> {
      _ref,
      url
    }
  },
  youtubeUrl,
  audioFile {
    asset-> {
      _ref,
      url
    }
  }
}`;

/**
 * Query สำหรับดึงประเภทสถานที่ทั้งหมด
 */
export const ALL_PLACE_TYPES_QUERY = `*[_type == "placeType"] {
  _id,
  title,
  slug,
  description,
  icon
}`;

/**
 * Query สำหรับดึงตำบล/พื้นที่ทั้งหมด
 */
export const ALL_DISTRICTS_QUERY = `*[_type == "district"] {
  _id,
  title,
  slug,
  description,
  mainImage {
    asset-> {
      url
    }
  }
}`;

/**
 * ฟังก์ชันสำหรับดึงสถานที่ท่องเที่ยวล่าสุด
 * @param limit จำนวนสถานที่ที่ต้องการดึง
 * @param options ตัวเลือกสำหรับการ revalidate
 * @returns Promise<Place[]>
 */
export async function getLatestPlaces(limit?: number, options = defaultRevalidateOptions): Promise<Place[]> {
  try {
    // ถ้าไม่มีการระบุ limit ให้ดึงทั้งหมด
    const limitClause = limit ? `[0...${limit}]` : '';
    
    const query = `*[
      _type == "place" && defined(slug.current)
    ] | order(coalesce(updatedAt, publishedAt) desc)${limitClause} {
      _id,
      title,
      slug,
      description,
      publishedAt,
      "placeType": placeType->{
        title,
        slug,
        icon
      },
      "district": district->{
        title,
        slug
      },
      mainImage {
        asset->{
          url
        }
      }
    }`;
    
    return await client.fetch<Place[]>(query, {}, options);
  } catch (error) {
    console.error('Error fetching latest places:', error);
    return [];
  }
}

/**
 * ฟังก์ชันสำหรับดึงสถานที่ท่องเที่ยวตามประเภท
 * @param placeType ชื่อประเภทสถานที่
 * @param options ตัวเลือกสำหรับการ revalidate
 * @returns Promise<Place[]>
 */
export async function getPlacesByType(placeType: string, options = defaultRevalidateOptions): Promise<Place[]> {
  try {
    return await client.fetch<Place[]>(
      PLACE_TYPE_QUERY, 
      { placeType }, 
      options
    );
  } catch (error) {
    console.error('Error fetching places by type:', error);
    return [];
  }
}

/**
 * ฟังก์ชันสำหรับดึงสถานที่ท่องเที่ยวตามตำบล/พื้นที่
 * @param district ชื่อตำบล/พื้นที่
 * @param options ตัวเลือกสำหรับการ revalidate
 * @returns Promise<Place[]>
 */
export async function getPlacesByDistrict(district: string, options = defaultRevalidateOptions): Promise<Place[]> {
  try {
    return await client.fetch<Place[]>(
      DISTRICT_PLACES_QUERY, 
      { district }, 
      options
    );
  } catch (error) {
    console.error('Error fetching places by district:', error);
    return [];
  }
}

/**
 * ฟังก์ชันสำหรับดึงข้อมูลสถานที่ท่องเที่ยวตาม slug
 * @param slug slug ของสถานที่ท่องเที่ยว
 * @param options ตัวเลือกสำหรับการ revalidate
 * @returns Promise<Place | null>
 */
export async function getPlaceBySlug(slug: string, options = defaultRevalidateOptions): Promise<Place | null> {
  try {
    return await client.fetch<Place | null>(
      PLACE_QUERY,
      { slug },
      options
    );
  } catch (error) {
    console.error('Error fetching place by slug:', error);
    return null;
  }
}

/**
 * ฟังก์ชันสำหรับดึงข้อมูลประเภทสถานที่ทั้งหมด
 * @param options ตัวเลือกสำหรับการ revalidate
 * @returns Promise<PlaceType[]>
 */
export async function getAllPlaceTypes(options = defaultRevalidateOptions): Promise<PlaceType[]> {
  try {
    return await client.fetch<PlaceType[]>(ALL_PLACE_TYPES_QUERY, {}, options);
  } catch (error) {
    console.error('Error fetching place types:', error);
    return [];
  }
}

/**
 * ฟังก์ชันสำหรับดึงข้อมูลตำบล/พื้นที่ทั้งหมด
 * @param options ตัวเลือกสำหรับการ revalidate
 * @returns Promise<District[]>
 */
export async function getAllDistricts(options = defaultRevalidateOptions): Promise<District[]> {
  try {
    return await client.fetch<District[]>(ALL_DISTRICTS_QUERY, {}, options);
  } catch (error) {
    console.error('Error fetching districts:', error);
    return [];
  }
}

/**
 * ฟังก์ชันสำหรับสร้าง metadata สำหรับหน้าสถานที่ท่องเที่ยว
 * @param place ข้อมูลสถานที่ท่องเที่ยว
 * @param baseUrl URL พื้นฐานของเว็บไซต์
 * @returns ข้อมูล metadata
 */
export const createPlaceMetadata = (place: Place, baseUrl: string) => {
  if (!place) return null;
  
  const placeTypeSlug = place.placeType?.slug?.current || 'uncategorized';
  const url = `${baseUrl}/place/${placeTypeSlug}/${place.slug.current}`;
  const imageUrl = place.mainImage?.asset?.url 
    ? `${place.mainImage.asset.url}?w=1200&h=630&fit=crop&auto=format`
    : null;
  
  // สร้าง description สำหรับ meta description
  const description = place.description || '';
  
  // เพิ่ม schema.org ในรูปแบบ JSON-LD สำหรับ TouristAttraction
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TouristAttraction',
    'name': place.title,
    'image': imageUrl ? [imageUrl] : [],
    'description': description,
    'address': {
      '@type': 'PostalAddress',
      'addressLocality': place.district?.title || 'บางกะเจ้า',
      'addressRegion': 'สมุทรปราการ',
      'addressCountry': 'TH'
    },
    ...(place.location ? {
      'geo': {
        '@type': 'GeoCoordinates',
        'latitude': place.location.lat,
        'longitude': place.location.lng
      }
    } : {}),
    ...(place.contactInfo?.phone ? {
      'telephone': place.contactInfo.phone
    } : {})
  };
  
  return {
    title: place.title,
    description: description || `สถานที่ท่องเที่ยว ${place.title} ที่บางกะเจ้า`,
    url,
    imageUrl,
    publishedAt: place.publishedAt,
    updatedAt: place.updatedAt,
    jsonLd: JSON.stringify(jsonLd)
  };
};