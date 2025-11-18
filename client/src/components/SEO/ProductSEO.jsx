import React from 'react';
import { Helmet } from 'react-helmet-async';

const ProductSEO = ({ product, category }) => {
  if (!product) return null;

  const {
    name,
    seo,
    images = [],
    price,
    brand,
    shortDescription,
    sku
  } = product;

  // Fallback SEO data if not provided
  const seoData = seo || {
    title: `${name} - ${brand} | TechVerse`,
    description: shortDescription || `Buy ${name} by ${brand}. High-quality ${category} with great features.`,
    keywords: [name.toLowerCase(), brand.toLowerCase(), category],
    canonical: `/products/${name.toLowerCase().replace(/\s+/g, '-')}`,
    robots: 'index, follow'
  };

  const primaryImage = images.find(img => img.isPrimary) || images[0];
  const imageUrl = primaryImage?.url || '/img/placeholder.jpg';
  const imageAlt = primaryImage?.alt || `${name} by ${brand}`;

  // Generate structured data
  const structuredData = seoData.structuredData || {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": name,
    "brand": {
      "@type": "Brand",
      "name": brand
    },
    "description": shortDescription,
    "image": [imageUrl],
    "offers": {
      "@type": "Offer",
      "price": price,
      "priceCurrency": "USD",
      "availability": product.stock?.quantity > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "seller": {
        "@type": "Organization",
        "name": "TechVerse"
      }
    },
    "sku": sku,
    "category": category
  };

  // Generate Open Graph data
  const openGraphData = seoData.openGraph || {
    "og:type": "product",
    "og:title": seoData.title,
    "og:description": seoData.description,
    "og:image": imageUrl,
    "og:url": window.location.href,
    "product:price:amount": price,
    "product:price:currency": "USD"
  };

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{seoData.title}</title>
      <meta name="description" content={seoData.description} />
      <meta name="keywords" content={Array.isArray(seoData.keywords) ? seoData.keywords.join(', ') : seoData.keywords} />
      <meta name="robots" content={seoData.robots} />
      <link rel="canonical" href={`${window.location.origin}${seoData.canonical}`} />

      {/* Open Graph Tags */}
      <meta property="og:type" content={openGraphData["og:type"]} />
      <meta property="og:title" content={openGraphData["og:title"]} />
      <meta property="og:description" content={openGraphData["og:description"]} />
      <meta property="og:image" content={`${window.location.origin}${openGraphData["og:image"]}`} />
      <meta property="og:image:alt" content={imageAlt} />
      <meta property="og:url" content={openGraphData["og:url"]} />
      <meta property="og:site_name" content="TechVerse" />
      
      {/* Product-specific Open Graph */}
      <meta property="product:price:amount" content={openGraphData["product:price:amount"]} />
      <meta property="product:price:currency" content={openGraphData["product:price:currency"]} />
      <meta property="product:availability" content={product.stock?.quantity > 0 ? "in stock" : "out of stock"} />
      <meta property="product:brand" content={brand} />
      <meta property="product:category" content={category} />

      {/* Twitter Card Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={seoData.title} />
      <meta name="twitter:description" content={seoData.description} />
      <meta name="twitter:image" content={`${window.location.origin}${imageUrl}`} />
      <meta name="twitter:image:alt" content={imageAlt} />

      {/* Additional Meta Tags */}
      <meta name="author" content="TechVerse" />
      <meta name="publisher" content="TechVerse" />
      <meta name="copyright" content="TechVerse" />
      
      {/* Product-specific Meta */}
      <meta name="product:price" content={`$${price}`} />
      <meta name="product:price:currency" content="USD" />
      <meta name="product:availability" content={product.stock?.quantity > 0 ? "in-stock" : "out-of-stock"} />
      <meta name="product:condition" content="new" />
      <meta name="product:brand" content={brand} />
      <meta name="product:category" content={category} />
      <meta name="product:sku" content={sku} />

      {/* Mobile and Responsive */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="format-detection" content="telephone=no" />

      {/* Structured Data (JSON-LD) */}
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>

      {/* Additional Images for Rich Snippets */}
      {images.slice(1, 4).map((image, index) => (
        <meta 
          key={index}
          property="og:image" 
          content={`${window.location.origin}${image.url}`} 
        />
      ))}

      {/* Breadcrumb Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org/",
          "@type": "BreadcrumbList",
          "itemListElement": [
            {
              "@type": "ListItem",
              "position": 1,
              "name": "Home",
              "item": window.location.origin
            },
            {
              "@type": "ListItem",
              "position": 2,
              "name": category.charAt(0).toUpperCase() + category.slice(1),
              "item": `${window.location.origin}/category/${category}`
            },
            {
              "@type": "ListItem",
              "position": 3,
              "name": name,
              "item": window.location.href
            }
          ]
        })}
      </script>

      {/* Organization Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "TechVerse",
          "url": window.location.origin,
          "logo": `${window.location.origin}/img/logo.png`,
          "sameAs": [
            "https://facebook.com/techverse",
            "https://twitter.com/techverse",
            "https://instagram.com/techverse"
          ]
        })}
      </script>
    </Helmet>
  );
};

export default ProductSEO;