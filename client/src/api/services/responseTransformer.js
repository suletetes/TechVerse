/**
 * Response Transformation Layer
 * 
 * Handles backend-to-frontend data mapping to resolve structure mismatches
 * identified in the Backend API Mismatch Analysis.
 */

/**
 * Transform backend response wrapper to frontend expected format
 */
export const transformResponseWrapper = (response) => {
  if (!response || typeof response !== 'object') {
    return response;
  }

  // Handle nested data structure (backend returns data.products, frontend expects data)
  if (response.data && typeof response.data === 'object') {
    // If data contains products array, extract it
    if (response.data.products && Array.isArray(response.data.products)) {
      return {
        success: response.success,
        data: response.data.products,
        pagination: transformPagination(response.data.pagination),
        message: response.message
      };
    }
    
    // If data contains other nested structures, handle them
    if (response.data.items && Array.isArray(response.data.items)) {
      return {
        success: response.success,
        data: response.data.items,
        pagination: transformPagination(response.data.pagination),
        message: response.message
      };
    }
  }

  // Return as-is if no transformation needed
  return response;
};

/**
 * Transform backend pagination to frontend expected format
 */
export const transformPagination = (backendPagination) => {
  if (!backendPagination || typeof backendPagination !== 'object') {
    return backendPagination;
  }

  return {
    page: backendPagination.currentPage || backendPagination.page || 1,
    limit: backendPagination.limit || 10,
    total: backendPagination.totalProducts || backendPagination.totalItems || backendPagination.total || 0,
    totalPages: backendPagination.totalPages || 0,
    hasMore: backendPagination.hasNextPage || backendPagination.hasMore || false,
    hasPrev: backendPagination.hasPrevPage || backendPagination.hasPrev || false
  };
};

/**
 * Transform backend product to frontend expected format
 */
export const transformProduct = (backendProduct) => {
  if (!backendProduct || typeof backendProduct !== 'object') {
    return backendProduct;
  }

  const transformed = {
    ...backendProduct,
    // Handle stock structure difference
    stock: typeof backendProduct.stock === 'object' 
      ? backendProduct.stock.quantity 
      : backendProduct.stock,
    
    // Calculate inStock boolean
    inStock: typeof backendProduct.stock === 'object'
      ? backendProduct.stock.quantity > 0
      : (backendProduct.stock || 0) > 0,
    
    // Handle primary image
    primaryImage: backendProduct.images?.find(img => img.isPrimary) || 
                  backendProduct.images?.[0] || 
                  backendProduct.primaryImage,
    
    // Ensure rating structure
    rating: backendProduct.rating || { average: 0, count: 0 },
    
    // Handle category structure
    category: backendProduct.category || null,
    
    // Handle sections array
    sections: backendProduct.sections || [],
    
    // Handle sales data
    sales: backendProduct.sales || { totalSold: 0, revenue: 0 }
  };

  // Remove undefined fields
  Object.keys(transformed).forEach(key => {
    if (transformed[key] === undefined) {
      delete transformed[key];
    }
  });

  return transformed;
};

/**
 * Transform array of products
 */
export const transformProducts = (products) => {
  if (!Array.isArray(products)) {
    return products;
  }
  
  return products.map(transformProduct);
};

/**
 * Transform backend user to frontend expected format
 */
export const transformUser = (backendUser) => {
  if (!backendUser || typeof backendUser !== 'object') {
    return backendUser;
  }

  return {
    _id: backendUser._id,
    firstName: backendUser.firstName,
    lastName: backendUser.lastName,
    email: backendUser.email,
    role: backendUser.role,
    isEmailVerified: backendUser.isEmailVerified,
    accountStatus: backendUser.accountStatus,
    createdAt: backendUser.createdAt,
    lastLogin: backendUser.lastLogin,
    // Add computed fields
    fullName: `${backendUser.firstName} ${backendUser.lastName}`,
    permissions: backendUser.permissions || []
  };
};

/**
 * Transform backend authentication response
 */
export const transformAuthResponse = (backendResponse) => {
  if (!backendResponse || !backendResponse.data) {
    return backendResponse;
  }

  const { data } = backendResponse;
  
  return {
    success: backendResponse.success,
    message: backendResponse.message,
    data: {
      user: transformUser(data.user),
      tokens: {
        accessToken: data.tokens.accessToken,
        refreshToken: data.tokens.refreshToken,
        expiresIn: typeof data.tokens.expiresIn === 'string' 
          ? parseExpiryToSeconds(data.tokens.expiresIn)
          : data.tokens.expiresIn,
        tokenType: data.tokens.tokenType || 'Bearer',
        expiresAt: data.tokens.expiresAt,
        sessionId: data.tokens.sessionId
      },
      security: data.security
    }
  };
};

/**
 * Parse expiry string to seconds
 */
const parseExpiryToSeconds = (expiresIn) => {
  if (typeof expiresIn === 'number') return expiresIn;
  
  const match = expiresIn.match(/^(\d+)([dhms])$/);
  if (!match) return 7 * 24 * 60 * 60; // Default 7 days in seconds
  
  const value = parseInt(match[1]);
  const unit = match[2];
  const multipliers = {
    d: 24 * 60 * 60,
    h: 60 * 60,
    m: 60,
    s: 1
  };
  
  return value * multipliers[unit];
};

/**
 * Transform backend address to frontend expected format
 */
export const transformAddress = (backendAddress) => {
  if (!backendAddress || typeof backendAddress !== 'object') {
    return backendAddress;
  }

  return {
    _id: backendAddress._id,
    type: backendAddress.type,
    firstName: backendAddress.firstName,
    lastName: backendAddress.lastName,
    company: backendAddress.company,
    street: backendAddress.address, // Field name mapping
    apartment: backendAddress.apartment,
    city: backendAddress.city,
    postalCode: backendAddress.postcode, // Field name mapping
    country: backendAddress.country,
    phone: backendAddress.phone,
    isDefault: backendAddress.isDefault
  };
};

/**
 * Transform frontend address to backend expected format
 */
export const transformAddressForBackend = (frontendAddress) => {
  if (!frontendAddress || typeof frontendAddress !== 'object') {
    return frontendAddress;
  }

  return {
    type: frontendAddress.type,
    firstName: frontendAddress.firstName,
    lastName: frontendAddress.lastName,
    company: frontendAddress.company,
    address: frontendAddress.street, // Field name mapping
    apartment: frontendAddress.apartment,
    city: frontendAddress.city,
    postcode: frontendAddress.postalCode, // Field name mapping
    country: frontendAddress.country,
    phone: frontendAddress.phone,
    isDefault: frontendAddress.isDefault
  };
};

/**
 * Transform backend cart to frontend expected format
 */
export const transformCart = (backendCart) => {
  if (!backendCart || typeof backendCart !== 'object') {
    return backendCart;
  }

  // Handle user.cart structure vs dedicated cart response
  const items = backendCart.items || backendCart.cart || backendCart;
  
  if (!Array.isArray(items)) {
    return backendCart;
  }

  const transformedItems = items.map(item => ({
    _id: item._id,
    product: transformProduct(item.product),
    quantity: item.quantity,
    variants: item.variants || [],
    price: item.price,
    total: item.price * item.quantity,
    addedAt: item.addedAt
  }));

  const subtotal = Array.isArray(transformedItems) && transformedItems.length > 0 
    ? transformedItems.reduce((sum, item) => sum + (item.total || 0), 0) 
    : 0;

  return {
    items: transformedItems,
    subtotal,
    itemCount: Array.isArray(transformedItems) && transformedItems.length > 0 
      ? transformedItems.reduce((sum, item) => sum + (item.quantity || 0), 0) 
      : 0,
    totalItems: Array.isArray(transformedItems) ? transformedItems.length : 0
  };
};

/**
 * Transform backend order to frontend expected format
 */
export const transformOrder = (backendOrder) => {
  if (!backendOrder || typeof backendOrder !== 'object') {
    return backendOrder;
  }

  return {
    ...backendOrder,
    items: backendOrder.items?.map(item => ({
      ...item,
      product: transformProduct(item.product)
    })) || [],
    shippingAddress: transformAddress(backendOrder.shippingAddress),
    user: transformUser(backendOrder.user)
  };
};

/**
 * Transform backend category to frontend expected format
 */
export const transformCategory = (backendCategory) => {
  if (!backendCategory || typeof backendCategory !== 'object') {
    return backendCategory;
  }

  return {
    _id: backendCategory._id,
    name: backendCategory.name,
    slug: backendCategory.slug,
    description: backendCategory.description,
    parent: backendCategory.parent,
    image: backendCategory.image,
    displayOrder: backendCategory.displayOrder,
    isActive: backendCategory.isActive,
    productCount: backendCategory.productCount || 0
  };
};

/**
 * Transform backend error to frontend expected format
 */
export const transformError = (backendError) => {
  if (!backendError || typeof backendError !== 'object') {
    return backendError;
  }

  try {
    return {
      message: backendError.error || backendError.message || 'An error occurred',
      status: backendError.status,
      code: backendError.code,
      details: backendError.details,
      data: backendError.data
    };
  } catch (error) {
    console.error('Error transforming error response:', error);
    return {
      message: 'An error occurred',
      status: 500,
      code: 'TRANSFORM_ERROR'
    };
  }
};

/**
 * Main transformation function that routes to specific transformers
 */
export const transformResponse = (response, transformationType = 'auto') => {
  if (!response) return response;

  try {
    switch (transformationType) {
      case 'products':
        return transformResponseWrapper(response);
      case 'product':
        return {
          ...response,
          data: transformProduct(response.data)
        };
      case 'auth':
        return transformAuthResponse(response);
      case 'user':
        return {
          ...response,
          data: transformUser(response.data)
        };
      case 'cart':
        return {
          ...response,
          data: transformCart(response.data)
        };
      case 'order':
        return {
          ...response,
          data: transformOrder(response.data)
        };
      case 'categories':
        return {
          ...response,
          data: Array.isArray(response.data) 
            ? response.data.map(transformCategory)
            : response.data
        };
      case 'error':
        return transformError(response);
      case 'auto':
      default:
        // Auto-detect transformation needed
        if (response.data?.products) {
          return transformResponseWrapper(response);
        }
        if (response.data?.tokens) {
          return transformAuthResponse(response);
        }
        return response;
    }
  } catch (error) {
    console.error('Response transformation error:', error);
    return response; // Return original response if transformation fails
  }
};

/**
 * Field mapping configurations for different data types
 */
export const FIELD_MAPPINGS = {
  product: {
    // Backend field -> Frontend field
    'stock.quantity': 'stock',
    'images[0]': 'primaryImage',
    'rating.average': 'rating.average',
    'rating.count': 'rating.count'
  },
  
  address: {
    'address': 'street',
    'postcode': 'postalCode'
  },
  
  pagination: {
    'currentPage': 'page',
    'totalProducts': 'total',
    'hasNextPage': 'hasMore',
    'hasPrevPage': 'hasPrev'
  },
  
  auth: {
    'tokens.expiresIn': 'tokens.expiresIn' // Special handling for string->number conversion
  }
};

/**
 * Generic field mapper using configuration
 */
export const mapFields = (data, mappingType) => {
  const mapping = FIELD_MAPPINGS[mappingType];
  if (!mapping || !data) return data;

  const mapped = { ...data };
  
  Object.entries(mapping).forEach(([backendField, frontendField]) => {
    const value = getNestedValue(data, backendField);
    if (value !== undefined) {
      setNestedValue(mapped, frontendField, value);
    }
  });

  return mapped;
};

/**
 * Get nested object value by path
 */
const getNestedValue = (obj, path) => {
  if (!obj || !path) return undefined;
  
  return path.split('.').reduce((current, key) => {
    if (!current) return undefined;
    
    if (key.includes('[') && key.includes(']')) {
      const [arrayKey, indexStr] = key.split('[');
      const index = parseInt(indexStr.replace(']', ''));
      return current?.[arrayKey]?.[index];
    }
    return current?.[key];
  }, obj);
};

/**
 * Set nested object value by path
 */
const setNestedValue = (obj, path, value) => {
  const keys = path.split('.');
  const lastKey = keys.pop();
  
  const target = keys.reduce((current, key) => {
    if (!current || typeof current !== 'object') return {};
    if (!current[key]) current[key] = {};
    return current[key];
  }, obj);
  
  target[lastKey] = value;
};

export default {
  transformResponse,
  transformResponseWrapper,
  transformPagination,
  transformProduct,
  transformProducts,
  transformUser,
  transformAuthResponse,
  transformAddress,
  transformAddressForBackend,
  transformCart,
  transformOrder,
  transformCategory,
  transformError,
  mapFields,
  FIELD_MAPPINGS
};