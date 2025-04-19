// src/lib/sanity/placeMetadata.ts
import { Place, GeoPoint, ContactInfo } from './schema';

/**
 * ฟังก์ชันสำหรับสร้าง metadata สำหรับหน้าสถานที่ท่องเที่ยว
 * @param place ข้อมูลสถานที่ท่องเที่ยว
 * @param baseUrl URL พื้นฐานของเว็บไซต์
 * @returns ข้อมูล metadata
 */
export interface PlaceMetadata {
  title: string;
  description: string;
  url: string;
  imageUrl: string | null;
  publishedAt?: string;
  updatedAt?: string;
  jsonLd: string;
}

export const createPlaceMetadata = (place: Place, baseUrl: string): PlaceMetadata | null => {
  if (!place) return null;
  
  const placeTypeSlug = place.placeType?.slug?.current || 'uncategorized';
  const url = `${baseUrl}/place/${placeTypeSlug}/${place.slug.current}`;
  const imageUrl = place.mainImage?.asset?.url 
    ? `${place.mainImage.asset.url}?w=1200&h=630&fit=crop&auto=format`
    : null;
  
  // สร้าง description สำหรับ meta description
  const description = place.description || '';
  
  // สร้าง JSON-LD สำหรับ TouristAttraction
  const jsonLdObject: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'TouristAttraction',
    'name': place.title,
    'description': description || `สถานที่ท่องเที่ยว ${place.title} ที่บางกระเจ้า`,
    'url': url
  };
  
  // เพิ่มรูปภาพ (ถ้ามี)
  if (imageUrl) {
    jsonLdObject.image = [imageUrl];
  }
  
  // เพิ่มที่อยู่ (ถ้ามี)
  if (place.address || place.district) {
    jsonLdObject.address = {
      '@type': 'PostalAddress',
      'addressLocality': place.district?.title || 'บางกระเจ้า',
      'addressRegion': 'สมุทรปราการ',
      'addressCountry': 'TH',
      'streetAddress': place.address
    };
  }
  
  // เพิ่มพิกัด (ถ้ามี)
  if (place.location) {
    const geoLocation: GeoPoint = place.location;
    if (geoLocation.lat && geoLocation.lng) {
      jsonLdObject.geo = {
        '@type': 'GeoCoordinates',
        'latitude': geoLocation.lat,
        'longitude': geoLocation.lng
      };
    }
  }
  
  // เพิ่มข้อมูลติดต่อ (ถ้ามี)
  if (place.contactInfo) {
    const contactInfo: ContactInfo = place.contactInfo;
    
    if (contactInfo.phone) {
      jsonLdObject.telephone = contactInfo.phone;
    }
    
    if (contactInfo.website) {
      jsonLdObject.sameAs = [contactInfo.website];
      
      // เพิ่ม Social Media (ถ้ามี)
      if (contactInfo.facebook) {
        if (Array.isArray(jsonLdObject.sameAs)) {
          jsonLdObject.sameAs.push(contactInfo.facebook);
        } else {
          jsonLdObject.sameAs = [contactInfo.website, contactInfo.facebook];
        }
      }
    }
  }
  
  // เพิ่มเวลาที่เผยแพร่และอัปเดต
  if (place.publishedAt) {
    jsonLdObject.datePublished = place.publishedAt;
  }
  
  if (place.updatedAt) {
    jsonLdObject.dateModified = place.updatedAt;
  }
  
  // เพิ่มข้อมูลราคา (ถ้ามี)
  if (place.pricing && place.pricing.length > 0) {
    // หาราคาเริ่มต้น (ต่ำสุด)
    const minPrice = Math.min(...place.pricing.map(p => p.price));
    
    jsonLdObject.priceRange = `฿${minPrice} บาทขึ้นไป`;
  }
  
  return {
    title: place.title,
    description: description || `สถานที่ท่องเที่ยว ${place.title} ที่บางกระเจ้า`,
    url,
    imageUrl,
    publishedAt: place.publishedAt,
    updatedAt: place.updatedAt,
    jsonLd: JSON.stringify(jsonLdObject)
  };
};