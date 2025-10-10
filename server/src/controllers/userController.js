import { User, Product } from '../models/index.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';
import paymentService from '../services/paymentService.js';
import logger from '../utils/logger.js';

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
export const getUserProfile = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id)
    .select('-password -emailVerificationToken -passwordResetToken')
    .lean();

  if (!user) {
    return next(new AppError('User not found', 404, 'USER_NOT_FOUND'));
  }

  res.status(200).json({
    success: true,
    message: 'Profile retrieved successfully',
    data: {
      user
    }
  });
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
export const updateUserProfile = asyncHandler(async (req, res, next) => {
  const allowedFields = ['firstName', 'lastName', 'phone', 'dateOfBirth', 'preferences'];
  const updates = {};

  // Only allow specific fields to be updated
  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });

  if (Object.keys(updates).length === 0) {
    return next(new AppError('No valid fields provided for update', 400, 'NO_UPDATE_FIELDS'));
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    updates,
    {
      new: true,
      runValidators: true
    }
  ).select('-password -emailVerificationToken -passwordResetToken');

  if (!user) {
    return next(new AppError('User not found', 404, 'USER_NOT_FOUND'));
  }

  logger.info('User profile updated', {
    userId: user._id,
    updatedFields: Object.keys(updates),
    ip: req.ip
  });

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      user
    }
  });
});

// @desc    Add user address
// @route   POST /api/users/addresses
// @access  Private
export const addAddress = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    return next(new AppError('User not found', 404, 'USER_NOT_FOUND'));
  }

  await user.addAddress(req.body);

  logger.info('Address added', {
    userId: user._id,
    addressType: req.body.type,
    ip: req.ip
  });

  res.status(201).json({
    success: true,
    message: 'Address added successfully',
    data: {
      addresses: user.addresses
    }
  });
});

// @desc    Update user address
// @route   PUT /api/users/addresses/:id
// @access  Private
export const updateAddress = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const user = await User.findById(req.user._id);

  if (!user) {
    return next(new AppError('User not found', 404, 'USER_NOT_FOUND'));
  }

  try {
    await user.updateAddress(id, req.body);

    logger.info('Address updated', {
      userId: user._id,
      addressId: id,
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'Address updated successfully',
      data: {
        addresses: user.addresses
      }
    });
  } catch (error) {
    return next(new AppError(error.message, 400, 'ADDRESS_UPDATE_ERROR'));
  }
});

// @desc    Delete user address
// @route   DELETE /api/users/addresses/:id
// @access  Private
export const deleteAddress = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const user = await User.findById(req.user._id);

  if (!user) {
    return next(new AppError('User not found', 404, 'USER_NOT_FOUND'));
  }

  try {
    await user.removeAddress(id);

    logger.info('Address deleted', {
      userId: user._id,
      addressId: id,
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'Address deleted successfully',
      data: {
        addresses: user.addresses
      }
    });
  } catch (error) {
    return next(new AppError(error.message, 400, 'ADDRESS_DELETE_ERROR'));
  }
});

// @desc    Add payment method
// @route   POST /api/users/payment-methods
// @access  Private
export const addPaymentMethod = asyncHandler(async (req, res, next) => {
  const { paymentMethodId, setAsDefault = false } = req.body;
  const user = await User.findById(req.user._id);

  if (!user) {
    return next(new AppError('User not found', 404, 'USER_NOT_FOUND'));
  }

  try {
    // Create or retrieve Stripe customer
    let stripeCustomerId = user.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await paymentService.createCustomer(user);
      stripeCustomerId = customer.id;
      user.stripeCustomerId = stripeCustomerId;
    }

    // Attach payment method to customer
    await paymentService.addPaymentMethod(stripeCustomerId, paymentMethodId);

    // Get payment method details from Stripe
    const paymentMethod = await paymentService.getPaymentMethod(paymentMethodId);

    // Add to user's payment methods
    const paymentMethodData = {
      type: paymentMethod.type,
      stripePaymentMethodId: paymentMethodId,
      isDefault: setAsDefault || user.paymentMethods.length === 0
    };

    if (paymentMethod.type === 'card') {
      paymentMethodData.cardLast4 = paymentMethod.card.last4;
      paymentMethodData.cardBrand = paymentMethod.card.brand;
      paymentMethodData.expiryMonth = paymentMethod.card.exp_month;
      paymentMethodData.expiryYear = paymentMethod.card.exp_year;
    }

    // If setting as default, unset others
    if (setAsDefault) {
      user.paymentMethods.forEach(pm => pm.isDefault = false);
    }

    user.paymentMethods.push(paymentMethodData);
    await user.save();

    logger.info('Payment method added', {
      userId: user._id,
      paymentMethodType: paymentMethod.type,
      isDefault: setAsDefault,
      ip: req.ip
    });

    res.status(201).json({
      success: true,
      message: 'Payment method added successfully',
      data: {
        paymentMethods: user.paymentMethods
      }
    });

  } catch (error) {
    logger.error('Failed to add payment method', error);
    return next(new AppError('Failed to add payment method', 500, 'PAYMENT_METHOD_ERROR'));
  }
});

// @desc    Update payment method
// @route   PUT /api/users/payment-methods/:id
// @access  Private
export const updatePaymentMethod = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { isDefault } = req.body;
  const user = await User.findById(req.user._id);

  if (!user) {
    return next(new AppError('User not found', 404, 'USER_NOT_FOUND'));
  }

  const paymentMethod = user.paymentMethods.id(id);
  if (!paymentMethod) {
    return next(new AppError('Payment method not found', 404, 'PAYMENT_METHOD_NOT_FOUND'));
  }

  // If setting as default, unset others
  if (isDefault) {
    user.paymentMethods.forEach(pm => pm.isDefault = false);
    paymentMethod.isDefault = true;
  }

  await user.save();

  logger.info('Payment method updated', {
    userId: user._id,
    paymentMethodId: id,
    ip: req.ip
  });

  res.status(200).json({
    success: true,
    message: 'Payment method updated successfully',
    data: {
      paymentMethods: user.paymentMethods
    }
  });
});

// @desc    Delete payment method
// @route   DELETE /api/users/payment-methods/:id
// @access  Private
export const deletePaymentMethod = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const user = await User.findById(req.user._id);

  if (!user) {
    return next(new AppError('User not found', 404, 'USER_NOT_FOUND'));
  }

  const paymentMethod = user.paymentMethods.id(id);
  if (!paymentMethod) {
    return next(new AppError('Payment method not found', 404, 'PAYMENT_METHOD_NOT_FOUND'));
  }

  try {
    // Remove from Stripe if it exists
    if (paymentMethod.stripePaymentMethodId) {
      await paymentService.removePaymentMethod(paymentMethod.stripePaymentMethodId);
    }

    // Remove from user
    paymentMethod.remove();
    await user.save();

    logger.info('Payment method deleted', {
      userId: user._id,
      paymentMethodId: id,
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'Payment method deleted successfully',
      data: {
        paymentMethods: user.paymentMethods
      }
    });

  } catch (error) {
    logger.error('Failed to delete payment method', error);
    return next(new AppError('Failed to delete payment method', 500, 'PAYMENT_METHOD_DELETE_ERROR'));
  }
});

// @desc    Get user wishlist
// @route   GET /api/users/wishlist
// @access  Private
export const getWishlist = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id)
    .populate({
      path: 'wishlist',
      select: 'name price images rating status',
      match: { status: 'active' }
    });

  if (!user) {
    return next(new AppError('User not found', 404, 'USER_NOT_FOUND'));
  }

  res.status(200).json({
    success: true,
    message: 'Wishlist retrieved successfully',
    data: {
      wishlist: user.wishlist
    }
  });
});

// @desc    Add product to wishlist
// @route   POST /api/users/wishlist/:productId
// @access  Private
export const addToWishlist = asyncHandler(async (req, res, next) => {
  const { productId } = req.params;
  const user = await User.findById(req.user._id);

  if (!user) {
    return next(new AppError('User not found', 404, 'USER_NOT_FOUND'));
  }

  // Check if product exists
  const product = await Product.findById(productId);
  if (!product) {
    return next(new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND'));
  }

  // Check if already in wishlist
  if (user.wishlist.includes(productId)) {
    return next(new AppError('Product already in wishlist', 400, 'PRODUCT_ALREADY_IN_WISHLIST'));
  }

  user.wishlist.push(productId);
  await user.save();

  logger.info('Product added to wishlist', {
    userId: user._id,
    productId,
    ip: req.ip
  });

  res.status(200).json({
    success: true,
    message: 'Product added to wishlist successfully',
    data: {
      wishlistCount: user.wishlist.length
    }
  });
});

// @desc    Remove product from wishlist
// @route   DELETE /api/users/wishlist/:productId
// @access  Private
export const removeFromWishlist = asyncHandler(async (req, res, next) => {
  const { productId } = req.params;
  const user = await User.findById(req.user._id);

  if (!user) {
    return next(new AppError('User not found', 404, 'USER_NOT_FOUND'));
  }

  // Check if product is in wishlist
  const index = user.wishlist.indexOf(productId);
  if (index === -1) {
    return next(new AppError('Product not in wishlist', 400, 'PRODUCT_NOT_IN_WISHLIST'));
  }

  user.wishlist.splice(index, 1);
  await user.save();

  logger.info('Product removed from wishlist', {
    userId: user._id,
    productId,
    ip: req.ip
  });

  res.status(200).json({
    success: true,
    message: 'Product removed from wishlist successfully',
    data: {
      wishlistCount: user.wishlist.length
    }
  });
});

// @desc    Get user cart
// @route   GET /api/users/cart
// @access  Private
export const getCart = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id)
    .populate({
      path: 'cart.product',
      select: 'name price images rating status stock'
    });

  if (!user) {
    return next(new AppError('User not found', 404, 'USER_NOT_FOUND'));
  }

  // Filter out products that are no longer available
  const availableCartItems = user.cart.filter(item => 
    item.product && item.product.status === 'active'
  );

  // Calculate cart totals
  const subtotal = availableCartItems.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);

  res.status(200).json({
    success: true,
    message: 'Cart retrieved successfully',
    data: {
      cart: availableCartItems,
      summary: {
        itemCount: availableCartItems.length,
        totalQuantity: availableCartItems.reduce((total, item) => total + item.quantity, 0),
        subtotal
      }
    }
  });
});

// @desc    Add product to cart
// @route   POST /api/users/cart
// @access  Private
export const addToCart = asyncHandler(async (req, res, next) => {
  const { productId, quantity = 1, variants = [] } = req.body;
  const user = await User.findById(req.user._id);

  if (!user) {
    return next(new AppError('User not found', 404, 'USER_NOT_FOUND'));
  }

  // Check if product exists and is available
  const product = await Product.findById(productId);
  if (!product) {
    return next(new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND'));
  }

  if (!product.isAvailable(quantity)) {
    return next(new AppError('Product is not available in requested quantity', 400, 'INSUFFICIENT_STOCK'));
  }

  // Calculate price including variants
  const price = product.getVariantPrice(variants);

  await user.addToCart(productId, quantity, variants, price);

  logger.info('Product added to cart', {
    userId: user._id,
    productId,
    quantity,
    price,
    ip: req.ip
  });

  res.status(200).json({
    success: true,
    message: 'Product added to cart successfully',
    data: {
      cartItemCount: user.cart.length
    }
  });
});

// @desc    Update cart item
// @route   PUT /api/users/cart/:itemId
// @access  Private
export const updateCartItem = asyncHandler(async (req, res, next) => {
  const { itemId } = req.params;
  const { quantity } = req.body;
  const user = await User.findById(req.user._id);

  if (!user) {
    return next(new AppError('User not found', 404, 'USER_NOT_FOUND'));
  }

  try {
    await user.updateCartItem(itemId, quantity);

    logger.info('Cart item updated', {
      userId: user._id,
      itemId,
      quantity,
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'Cart item updated successfully',
      data: {
        cartItemCount: user.cart.length
      }
    });
  } catch (error) {
    return next(new AppError(error.message, 400, 'CART_UPDATE_ERROR'));
  }
});

// @desc    Remove item from cart
// @route   DELETE /api/users/cart/:itemId
// @access  Private
export const removeFromCart = asyncHandler(async (req, res, next) => {
  const { itemId } = req.params;
  const user = await User.findById(req.user._id);

  if (!user) {
    return next(new AppError('User not found', 404, 'USER_NOT_FOUND'));
  }

  try {
    await user.removeFromCart(itemId);

    logger.info('Item removed from cart', {
      userId: user._id,
      itemId,
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'Item removed from cart successfully',
      data: {
        cartItemCount: user.cart.length
      }
    });
  } catch (error) {
    return next(new AppError(error.message, 400, 'CART_REMOVE_ERROR'));
  }
});

// @desc    Clear user cart
// @route   DELETE /api/users/cart
// @access  Private
export const clearCart = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    return next(new AppError('User not found', 404, 'USER_NOT_FOUND'));
  }

  await user.clearCart();

  logger.info('Cart cleared', {
    userId: user._id,
    ip: req.ip
  });

  res.status(200).json({
    success: true,
    message: 'Cart cleared successfully',
    data: {
      cartItemCount: 0
    }
  });
});