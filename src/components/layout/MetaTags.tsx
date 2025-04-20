// src/components/SEO/MetaTags.tsx
import Head from 'next/head';
import React from 'react';

interface MetaTagsProps {
  title: string;
  description: string;
  ogImage?: string;
  ogUrl?: string;
  ogType?: 'website' | 'article';
  twitterCard?: 'summary' | 'summary_large_image';
  canonicalUrl?: string;
  keywords?: string;
  author?: string;
  published?: string;
  modified?: string;
}

export const MetaTags: React.FC<MetaTagsProps> = ({
  title,
  description,
  ogImage,
  ogUrl,
  ogType = 'website',
  twitterCard = 'summary_large_image',
  canonicalUrl,
  keywords,
  author,
  published,
  modified,
}) => {
  return (
    <Head>
      {/* ข้อมูลพื้นฐาน */}
      <title>{title}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      
      {/* Open Graph Tags */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={ogType} />
      {ogUrl && <meta property="og:url" content={ogUrl} />}
      {ogImage && <meta property="og:image" content={ogImage} />}
      <meta property="og:site_name" content="บางกระเจ้า" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {ogImage && <meta name="twitter:image" content={ogImage} />}
      
      {/* Canonical URL */}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
      
      {/* Article เพิ่มเติมสำหรับบทความ */}
      {ogType === 'article' && author && <meta property="article:author" content={author} />}
      {ogType === 'article' && published && <meta property="article:published_time" content={published} />}
      {ogType === 'article' && modified && <meta property="article:modified_time" content={modified} />}
    </Head>
  );
};