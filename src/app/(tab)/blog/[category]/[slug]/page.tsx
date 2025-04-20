// src/app/blog/[category]/[slug]/page.tsx
import React from "react";
import { notFound } from "next/navigation";
import { CommentSection, ImageModal, SlugBreadcrumb, SlugShareButton } from "@/components";
import { getPostBySlug, urlFor, formatThaiDate, createPostMetadata } from "@/lib/sanity";
import { Image, Link } from "@heroui/react";
import { PortableText } from "next-sanity";
import { Metadata } from "next";
import { headers } from 'next/headers';
import { PortableTextReactComponents } from "@portabletext/react";
import { FaQuoteLeft } from "react-icons/fa6";
import Script from "next/script";

// กำหนด metadata แบบ dynamic จากข้อมูลบทความ
export async function generateMetadata(
  { params }: { params: { category: string; slug: string } }
): Promise<Metadata> {
  // ดึงข้อมูลบทความ
  const post = await getPostBySlug(params.slug);

  if (!post) {
    return {
      title: "ไม่พบบทความ",
      description: "ไม่พบบทความที่คุณกำลังมองหา",
    };
  }

  // สร้าง URL สำหรับ Open Graph
  const headersList = headers();
  const domain = headersList.get('host') || '';
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
  const baseUrl = `${protocol}://${domain}`;
  // const categorySlug = post.categories?.[0]?.slug || 'uncategorized';
  // const ogUrl = `${baseUrl}/blog/${categorySlug}/${post.slug.current}`;

  // // กำหนด URL รูปภาพสำหรับ Open Graph
  // const ogImageUrl = post.mainImage?.asset?.url
  //   ? `${post.mainImage.asset.url}?w=1200&h=630&fit=crop&auto=format`
  //   : null;

  // สร้าง metadata สำหรับบทความ
  // สร้าง metadata สำหรับบทความ
  const postMetadata = createPostMetadata(post, baseUrl);

  // ถ้า postMetadata เป็น null ให้กำหนดค่าเริ่มต้น
  if (!postMetadata) {
    return {
      title: "ไม่พบบทความ",
      description: "ไม่พบบทความที่คุณกำลังมองหา",
    };
  }

  // ส่งคืนค่า metadata จาก postMetadata ที่ไม่เป็น null แล้ว
  return {
    title: postMetadata.title,
    description: postMetadata.description,
    openGraph: {
      title: postMetadata.title,
      description: postMetadata.description,
      url: postMetadata.url,
      images: postMetadata.imageUrl ? [{ url: postMetadata.imageUrl }] : undefined,
      type: 'article',
      publishedTime: post.publishedAt,
      authors: post.author?.name ? [post.author.name] : undefined,
    },
    alternates: {
      canonical: postMetadata.url,
    },
    twitter: {
      card: 'summary_large_image',
      title: postMetadata.title,
      description: postMetadata.description,
      images: postMetadata.imageUrl ? [postMetadata.imageUrl] : [],
    }
  };
}

const portableTextComponents: Partial<PortableTextReactComponents> = {
  block: {
    h1: ({ children }) => <h1 className="text-3xl font-bold mb-3">{children}</h1>,
    h2: ({ children }) => <h2 className="text-2xl font-bold mb-3">{children}</h2>,
    h3: ({ children }) => <h3 className="text-xl font-bold mb-3">{children}</h3>,
    h4: ({ children }) => <h4 className="text-lg font-bold mb-3">{children}</h4>,
    normal: ({ children }) => <p className="text-base leading-relaxed">{children}</p>,
    blockquote: ({ children }) => (
      <blockquote className="relative pl-6 pr-2 my-6 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
        <div className="absolute top-0 left-0 w-1 h-full bg-primary-color rounded-l-lg"></div>
        <div className="relative">
          <FaQuoteLeft className="absolute -top-2 -left-4 h-4 w-4 text-primary-color" fill="currentColor" />
          <div className="text-lg text-zinc-700 dark:text-zinc-300 italic">
            {children}
          </div>
        </div>
      </blockquote>
    ),
  },
  marks: {
    strong: ({ children }) => <strong className="font-bold">{children}</strong>,
    em: ({ children }) => <em className="italic">{children}</em>,
    link: ({ value, children }) => {
      const href = value?.href || "#";
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline"
        >
          {children}
        </a>
      );
    },
  } as PortableTextReactComponents["marks"],
  types: {
    image: ({ value }) => {
      const imageUrl = urlFor(value)?.width(1366).auto("format").url();
      const originalUrl = value?.asset?._ref ? urlFor(value)?.url() ?? null : null;
      return imageUrl ? (
        <ImageModal
          src={imageUrl}
          originalSrc={originalUrl as string}
          alt="Sanity Image"
          className="rounded-lg shadow-lg w-full my-2"
        />
      ) : null;
    },
  },
};

// Component แสดงข้อความเมื่อไม่พบบทความ
const PostNotFound = () => (
  <div className="container mx-auto max-w-5xl flex-grow px-4 my-10 flex flex-col items-center justify-center gap-6 min-h-[50vh] font-[family-name:var(--font-bai-jamjuree)]">
    <div className="text-center">
      <h1 className="text-4xl md:text-5xl font-bold mb-4">ไม่พบบทความ</h1>
      <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-8">
        ขออภัย ไม่พบบทความที่คุณกำลังมองหา
      </p>
      <Link href="/blog" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors">
        กลับไปยังหน้าบทความ
      </Link>
    </div>
  </div>
);

/**
 * หน้าแสดงบทความเฉพาะ
 */
export default async function PostPage({
  params,
}: {
  params: { category: string; slug: string }
}) {
  // ตรวจสอบว่ามีพารามิเตอร์ slug หรือไม่
  if (!params.slug) {
    notFound();
  }

  try {
    // ดึงข้อมูลบทความจาก Sanity
    const post = await getPostBySlug(params.slug, {
      next: { revalidate: 60 }
    });

    // ถ้าไม่พบบทความ
    if (!post) {
      return <PostNotFound />;
    }

    // เตรียมข้อมูลสำหรับแสดงผล
    const headersList = headers();
    const domain = headersList.get('host') || '';
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
    const baseUrl = `${protocol}://${domain}`;
    const categorySlug = post.categories?.[0]?.slug || 'uncategorized';
    const fullUrl = `${baseUrl}/blog/${categorySlug}/${post.slug.current}`;

    const mainImageUrl = post.mainImage?.asset?.url
      ? `${post.mainImage.asset.url}?w=1600&auto=format`
      : null;
    const originalMainImageUrl = post.mainImage?.asset?.url || null;

    // สร้าง metadata สำหรับบทความ (มี JSON-LD)
    const postMetadata = createPostMetadata(post, baseUrl);

    return (
      <div>
        {/* เพิ่ม JSON-LD schema สำหรับ SEO */}
        {postMetadata?.jsonLd && (
          <Script
            id={`post-jsonld-${post._id}`}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: postMetadata.jsonLd }}
          />
        )}

        <section className="container mx-auto max-w-5xl flex-grow px-4 my-5 flex flex-col gap-5 font-[family-name:var(--font-bai-jamjuree)]">
          {/* Breadcrumb */}
          <SlugBreadcrumb
            postTitle={post.title}
            postSlug={post.slug.current}
            category={post.categories?.[0]}
          />

          {/* รูปภาพหลัก */}
          <div className="prose prose-2xl dark:prose-invert prose-zinc">
            {mainImageUrl ? (
              <ImageModal
                src={mainImageUrl}
                originalSrc={originalMainImageUrl}
                alt={post.title}
                className="rounded-lg shadow-lg w-full my-1"
              />
            ) : (
              <div className="aspect-video bg-zinc-200 rounded-lg shadow-lg flex items-center justify-center">
                <p className="text-zinc-500">ไม่มีรูปภาพ</p>
              </div>
            )}
          </div>

          {/* หัวข้อบทความ */}
          <div className="text-center prose prose-2xl dark:prose-invert prose-zinc">
            <h1 className="text-3xl md:text-4xl font-bold">{post.title}</h1>
          </div>

          {/* ข้อมูลเกี่ยวกับบทความและปุ่มแชร์ */}
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="flex flex-col gap-2">
                <p className="text-base">
                  📅 เผยแพร่: {formatThaiDate(post.publishedAt)}
                </p>
                {post.author && (
                  <div className="flex items-center gap-2">
                    {post.author.image && (
                      <Image
                        src={urlFor(post.author.image)?.width(80).auto("format").url()}
                        alt={post.author.name}
                        width={40}
                        height={40}
                        className="rounded-full"
                      />
                    )}
                    <p className="text-base">
                      ✍️ เขียนโดย:{" "}
                      <span className="font-medium">
                        {post.author.name}
                      </span>
                    </p>
                  </div>
                )}
              </div>
            </div>
            {/* ปุ่มแชร์ */}
            <SlugShareButton
              url={fullUrl}
              title={post.title}
              contentItem={post}
              contentType="blog"
            />
          </div>

          <div className="w-full border-1 border-primary my-4" />
        </section>

        {/* เนื้อหาบทความ */}
        <section className="container mx-auto max-w-4xl flex-grow px-4 my-5 flex flex-col gap-5 font-[family-name:var(--font-bai-jamjuree)]">
          <article className="mt-2 mb-10 prose prose-2xl dark:prose-invert prose-zinc">
            {Array.isArray(post.body) ? (
              <PortableText value={post.body} components={portableTextComponents} />
            ) : (
              <p className="text-zinc-500">ไม่มีเนื้อหา</p>
            )}
          </article>
        </section>

        {/* ส่วนความคิดเห็น */}
        <section className="container mx-auto max-w-5xl flex-grow px-4 my-5 flex flex-col gap-5 font-[family-name:var(--font-bai-jamjuree)]">
          <CommentSection postId={post.slug.current} />
        </section>
      </div>
    );
  } catch (error) {
    console.error("Error fetching post:", error);
    return <PostNotFound />;
  }
}