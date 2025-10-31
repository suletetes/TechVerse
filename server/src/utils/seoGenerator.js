// SEO and Media Enhancement Generator
// Generates SEO-optimized content and media configurations for products

/**
 * Generate SEO-optimized meta data for products
 * @param {Object} product - Product object
 * @param {string} category - Product category
 * @returns {Object} SEO configuration
 */
export const generateProductSEO = (product, category) => {
  const { name, brand, shortDescription, price, features = [] } = product;
  
  // Generate SEO title
  const title = generateSEOTitle(name, brand, category);
  
  // Generate meta description
  const description = generateMetaDescription(name, brand, shortDescription, features, price);
  
  // Generate keywords
  const keywords = generateKeywords(product, category);
  
  // Generate structured data
  const structuredData = generateStructuredData(product, category);
  
  // Generate Open Graph data
  const openGraph = generateOpenGraphData(product, title, description);
  
  return {
    title,
    description,
    keywords,
    structuredData,
    openGraph,
    canonical: `/products/${generateSlug(name)}`,
    robots: 'index, follow',
    lastModified: new Date().toISOString()
  };
};

/**
 * Generate SEO-optimized title
 * @param {string} name - Product name
 * @param {string} brand - Product brand
 * @param {string} category - Product category
 * @returns {string} SEO title
 */
const generateSEOTitle = (name, brand, category) => {
  const categoryNames = {
    phones: 'Smartphone',
    tablets: 'Tablet',
    computers: 'Laptop',
    tvs: 'Smart TV',
    gaming: 'Gaming Console',
    watches: 'Smartwatch',
    audio: 'Headphones',
    cameras: 'Camera',
    accessories: 'Tech Accessory',
    'home-smart-devices': 'Smart Home Device',
    'fitness-health': 'Fitness Tracker'
  };

  const categoryName = categoryNames[category] || 'Tech Product';
  
  // Keep title under 60 characters for optimal SEO
  const baseTitle = `${name} - ${brand} ${categoryName}`;
  
  if (baseTitle.length <= 50) {
    return `${baseTitle} | TechVerse`;
  } else if (baseTitle.length <= 55) {
    return `${baseTitle} | TV`;
  } else {
    return baseTitle.substring(0, 57) + '...';
  }
};

/**
 * Generate meta description
 * @param {string} name - Product name
 * @param {string} brand - Product brand
 * @param {string} shortDescription - Product short description
 * @param {Array} features - Product features
 * @param {number} price - Product price
 * @returns {string} Meta description
 */
const generateMetaDescription = (name, brand, shortDescription, features, price) => {
  let description = `Buy ${name} by ${brand}. ${shortDescription}`;
  
  // Add key features if space allows
  if (features.length > 0 && description.length < 120) {
    const topFeatures = features.slice(0, 2).join(', ');
    description += ` Features: ${topFeatures}.`;
  }
  
  // Add price if space allows
  if (description.length < 140) {
    description += ` Starting at $${price}.`;
  }
  
  // Add call to action
  if (description.length < 145) {
    description += ' Free shipping available.';
  }
  
  // Ensure description is under 160 characters
  if (description.length > 160) {
    description = description.substring(0, 157) + '...';
  }
  
  return description;
};

/**
 * Generate SEO keywords
 * @param {Object} product - Product object
 * @param {string} category - Product category
 * @returns {Array} Keywords array
 */
const generateKeywords = (product, category) => {
  const { name, brand, tags = [], features = [] } = product;
  
  const keywords = new Set();
  
  // Add basic product info
  keywords.add(name.toLowerCase());
  keywords.add(brand.toLowerCase());
  keywords.add(`${brand.toLowerCase()} ${name.toLowerCase()}`);
  
  // Add category-specific keywords
  const categoryKeywords = {
    phones: ['smartphone', 'mobile phone', 'cell phone', '5g phone', 'android', 'ios'],
    tablets: ['tablet', 'ipad', 'android tablet', 'touchscreen tablet'],
    computers: ['laptop', 'notebook', 'computer', 'ultrabook', 'macbook'],
    tvs: ['smart tv', 'television', '4k tv', 'oled tv', 'qled tv'],
    gaming: ['gaming console', 'video game console', 'gaming system'],
    watches: ['smartwatch', 'fitness tracker', 'wearable', 'smart watch'],
    audio: ['headphones', 'earbuds', 'wireless headphones', 'bluetooth headphones'],
    cameras: ['digital camera', 'mirrorless camera', 'dslr camera'],
    accessories: ['tech accessories', 'phone accessories', 'computer accessories'],
    'home-smart-devices': ['smart home', 'home automation', 'iot device'],
    'fitness-health': ['fitness tracker', 'health monitor', 'activity tracker']
  };
  
  (categoryKeywords[category] || []).forEach(keyword => keywords.add(keyword));
  
  // Add product tags
  tags.forEach(tag => keywords.add(tag.replace('-', ' ')));
  
  // Add feature-based keywords
  features.forEach(feature => {
    const featureWords = feature.toLowerCase().split(' ');
    featureWords.forEach(word => {
      if (word.length > 3) keywords.add(word);
    });
  });
  
  // Add brand + category combinations
  keywords.add(`${brand.toLowerCase()} ${category}`);
  
  // Add price-related keywords
  keywords.add('buy online');
  keywords.add('free shipping');
  keywords.add('best price');
  
  return Array.from(keywords).slice(0, 20); // Limit to 20 keywords
};

/**
 * Generate structured data (JSON-LD)
 * @param {Object} product - Product object
 * @param {string} category - Product category
 * @returns {Object} Structured data
 */
const generateStructuredData = (product, category) => {
  const { name, brand, shortDescription, price, images = [], features = [] } = product;
  
  return {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": name,
    "brand": {
      "@type": "Brand",
      "name": brand
    },
    "description": shortDescription,
    "image": images.filter(img => img.isPrimary).map(img => img.url),
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
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.5",
      "reviewCount": "127"
    },
    "category": category,
    "sku": product.sku,
    "additionalProperty": features.map(feature => ({
      "@type": "PropertyValue",
      "name": "Feature",
      "value": feature
    }))
  };
};

/**
 * Generate Open Graph data
 * @param {Object} product - Product object
 * @param {string} title - SEO title
 * @param {string} description - Meta description
 * @returns {Object} Open Graph data
 */
const generateOpenGraphData = (product, title, description) => {
  const { name, images = [], price } = product;
  const primaryImage = images.find(img => img.isPrimary) || images[0];
  
  return {
    "og:type": "product",
    "og:title": title,
    "og:description": description,
    "og:image": primaryImage?.url || '/img/placeholder.jpg',
    "og:image:alt": primaryImage?.alt || name,
    "og:url": `/products/${generateSlug(name)}`,
    "og:site_name": "TechVerse",
    "product:price:amount": price,
    "product:price:currency": "USD",
    "twitter:card": "summary_large_image",
    "twitter:title": title,
    "twitter:description": description,
    "twitter:image": primaryImage?.url || '/img/placeholder.jpg'
  };
};

/**
 * Generate URL slug from product name
 * @param {string} name - Product name
 * @returns {string} URL slug
 */
const generateSlug = (name) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim('-'); // Remove leading/trailing hyphens
};

/**
 * Generate multiple product images with proper alt text
 * @param {Object} product - Product object
 * @param {string} category - Product category
 * @returns {Array} Enhanced images array
 */
export const generateProductImages = (product, category) => {
  const { name, brand } = product;
  const baseSlug = generateSlug(name);
  
  // Define image types by category
  const imageTypes = {
    phones: ['main', 'back', 'side', 'screen'],
    tablets: ['main', 'side', 'keyboard', 'pencil'],
    computers: ['main', 'open', 'ports', 'keyboard'],
    tvs: ['main', 'side', 'remote', 'wall-mount'],
    gaming: ['main', 'controller', 'games', 'setup'],
    watches: ['main', 'bands', 'screen', 'charging'],
    audio: ['main', 'wearing', 'case', 'controls'],
    cameras: ['main', 'lens', 'back', 'viewfinder'],
    accessories: ['main', 'usage', 'compatibility', 'package'],
    'home-smart-devices': ['main', 'setup', 'app', 'room'],
    'fitness-health': ['main', 'wearing', 'app', 'charging']
  };
  
  const types = imageTypes[category] || ['main', 'side', 'detail', 'package'];
  
  return types.map((type, index) => ({
    url: `/img/${baseSlug}-${type}.jpg`,
    alt: generateImageAlt(name, brand, type),
    isPrimary: index === 0,
    type: type,
    width: 800,
    height: 600,
    format: 'jpg'
  }));
};

/**
 * Generate descriptive alt text for images
 * @param {string} name - Product name
 * @param {string} brand - Product brand
 * @param {string} type - Image type
 * @returns {string} Alt text
 */
const generateImageAlt = (name, brand, type) => {
  const typeDescriptions = {
    main: `${name} by ${brand}`,
    back: `${name} - Back view`,
    side: `${name} - Side profile`,
    screen: `${name} - Display screen`,
    keyboard: `${name} - With keyboard`,
    pencil: `${name} - With stylus`,
    open: `${name} - Open view`,
    ports: `${name} - Connectivity ports`,
    remote: `${name} - With remote control`,
    'wall-mount': `${name} - Wall mounted`,
    controller: `${name} - With controller`,
    games: `${name} - Gaming setup`,
    setup: `${name} - Complete setup`,
    bands: `${name} - Different band options`,
    charging: `${name} - Charging dock`,
    wearing: `${name} - Being worn`,
    case: `${name} - Carrying case`,
    controls: `${name} - Control buttons`,
    lens: `${name} - Camera lens`,
    viewfinder: `${name} - Viewfinder display`,
    usage: `${name} - In use`,
    compatibility: `${name} - Device compatibility`,
    package: `${name} - Package contents`,
    app: `${name} - Mobile app interface`,
    room: `${name} - Room installation`
  };
  
  return typeDescriptions[type] || `${name} - ${type} view`;
};

/**
 * Generate product features array with SEO optimization
 * @param {Object} product - Product object
 * @param {string} category - Product category
 * @returns {Array} Enhanced features array
 */
export const generateProductFeatures = (product, category) => {
  const { specifications = [] } = product;
  
  // Extract key features from specifications
  const keySpecs = [
    'Processor', 'Display Size', 'Battery Life', 'Main Camera', 
    'Storage', 'RAM', 'Water Resistance', 'Operating System'
  ];
  
  const features = [];
  
  // Add specification-based features
  keySpecs.forEach(specName => {
    const spec = specifications.find(s => s.name === specName);
    if (spec) {
      features.push(`${spec.name}: ${spec.value}${spec.unit || ''}`);
    }
  });
  
  // Add category-specific features
  const categoryFeatures = {
    phones: ['5G connectivity', 'Wireless charging', 'Face recognition', 'Fingerprint sensor'],
    tablets: ['Multi-touch display', 'Stylus support', 'Split-screen multitasking', 'Cloud sync'],
    computers: ['Full-size keyboard', 'Multiple ports', 'Fast boot', 'Energy efficient'],
    tvs: ['Smart TV platform', 'Voice control', 'Multiple HDMI ports', '4K upscaling'],
    gaming: ['4K gaming', 'Ray tracing', 'Backward compatibility', 'Online multiplayer'],
    watches: ['Health monitoring', 'GPS tracking', 'Notifications', 'Fitness apps'],
    audio: ['Noise cancellation', 'Long battery life', 'Quick charge', 'Voice assistant'],
    cameras: ['Image stabilization', 'Manual controls', 'RAW support', 'Video recording'],
    accessories: ['Universal compatibility', 'Durable design', 'Easy installation', 'Warranty included'],
    'home-smart-devices': ['Voice control', 'App integration', 'Energy monitoring', 'Remote access'],
    'fitness-health': ['24/7 monitoring', 'Workout tracking', 'Sleep analysis', 'Health insights']
  };
  
  const categorySpecificFeatures = categoryFeatures[category] || [];
  features.push(...categorySpecificFeatures.slice(0, 4));
  
  return features.slice(0, 8); // Limit to 8 features
};

/**
 * Generate comprehensive product tags for search and filtering
 * @param {Object} product - Product object
 * @param {string} category - Product category
 * @returns {Array} Enhanced tags array
 */
export const generateProductTags = (product, category) => {
  const { brand, name, specifications = [] } = product;
  const tags = new Set();
  
  // Add basic tags
  tags.add(category);
  tags.add(brand.toLowerCase());
  tags.add('tech');
  tags.add('electronics');
  
  // Add category-specific tags
  const categoryTags = {
    phones: ['smartphone', 'mobile', '5g', 'android', 'ios'],
    tablets: ['tablet', 'touchscreen', 'portable'],
    computers: ['laptop', 'pc', 'computing', 'productivity'],
    tvs: ['television', 'entertainment', '4k', 'streaming'],
    gaming: ['console', 'games', 'entertainment'],
    watches: ['wearable', 'fitness', 'health', 'smartwatch'],
    audio: ['sound', 'music', 'wireless', 'bluetooth'],
    cameras: ['photography', 'video', 'imaging'],
    accessories: ['accessory', 'add-on', 'enhancement'],
    'home-smart-devices': ['smart-home', 'iot', 'automation'],
    'fitness-health': ['fitness', 'health', 'wellness', 'tracking']
  };
  
  (categoryTags[category] || []).forEach(tag => tags.add(tag));
  
  // Add specification-based tags
  specifications.forEach(spec => {
    if (spec.name === 'Operating System') {
      if (spec.value.includes('iOS')) tags.add('ios');
      if (spec.value.includes('Android')) tags.add('android');
      if (spec.value.includes('Windows')) tags.add('windows');
      if (spec.value.includes('macOS')) tags.add('macos');
    }
    
    if (spec.name === 'Water Resistance' && spec.value !== 'No') {
      tags.add('waterproof');
    }
    
    if (spec.name === 'Wireless Charging' && spec.value !== 'No') {
      tags.add('wireless-charging');
    }
  });
  
  // Add brand-specific tags
  const brandTags = {
    'Apple': ['premium', 'ecosystem', 'design'],
    'Samsung': ['innovation', 'display', 'android'],
    'Google': ['ai', 'pure-android', 'photography'],
    'Sony': ['entertainment', 'audio', 'gaming'],
    'Microsoft': ['productivity', 'business', 'windows']
  };
  
  (brandTags[brand] || []).forEach(tag => tags.add(tag));
  
  return Array.from(tags).slice(0, 15); // Limit to 15 tags
};

export default {
  generateProductSEO,
  generateProductImages,
  generateProductFeatures,
  generateProductTags,
  generateSlug
};