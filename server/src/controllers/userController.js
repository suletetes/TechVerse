import { User, Product, Cart, Wishlist } from '../models/index.js';
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
    data: { user }
  });
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
export const updateUserProfile = asyncHandler(async (req, res, next) => {
  const allowedFields = ['firstName', 'lastName', 'phone', 'dateOfBirth', 'preferences'];
  const updates = {};

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
    { new: true, runValidators: true }
  ).select('-password -emailVerificationToken -passwordResetToken');

  if (!user) {
    return next(new AppError('User not found', 404, 'USER_NOT_FOUND'));
  }

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: { user }
  });
});

// @desc    Get user addresses
// @route   GET /api/users/addresses
// @access  Private
export const getAddresses = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id).select('addresses');
  
  if (!user) {
    return next(new AppError('User not found', 404, 'USER_NOT_FOUND'));
  }

  res.status(200).json({
    success: true,
    message: 'Addresses retrieved successfully',
    data: { addresses: user.addresses }
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

  res.status(201).json({
    success: true,
    message: 'Address added successfully',
    data: { addresses: user.addresses }
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
    res.status(200).json({
      success: true,
      message: 'Address updated successfully',
      data: { addresses: user.addresses }
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
    res.status(200).json({
      success: true,
      message: 'Address deleted successfully',
      data: { addresses: user.addresses }
    });
  } catch (error) {
    return next(new AppError(error.message, 400, 'ADDRESS_DELETE_ERROR'));
  }
});

// @desc    Get payment methods
// @route   GET /api/users/payment-methods
// @access  Private
export const getPaymentMethods = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id).select('paymentMethods');
  
  if (!user) {
    return next(new AppError('User not found', 404, 'USER_NOT_FOUND'));
  }

  res.status(200).json({
    success: true,
    message: 'Payment methods retrieved successfully',
    data: { paymentMethods: user.paymentMethods }
  });
});

// @desc    Add payment method
// @route   POST /api/users/payment-methods
// @access  Private
export const addPaymentMethod = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    return next(new AppError('User not found', 404, 'USER_NOT_FOUND'));
  }

  await user.addPaymentMethod(req.body);

  res.status(201).json({
    success: true,
    message: 'Payment method added successfully',
    data: { paymentMethods: user.paymentMethods }
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

  try {
    await user.removePaymentMethod(id);
    res.status(200).json({
      success: true,
      message: 'Payment method deleted successfully',
      data: { paymentMethods: user.paymentMethods }
    });
  } catch (error) {
    return next(new AppError(error.message, 400, 'PAYMENT_METHOD_DELETE_ERROR'));
  }
});

// @desc    Get user cart
// @route   GET /api/users/cart
// @access  Private
export const getCart = asyncHandler(async (req, res, next) => {
  let cart = await Cart.findOne({ user: req.user._id })
    .populate('items.product', 'name price images stock status');

  if (!cart) {
    cart = await Cart.create({ user: req.user._id, items: [] });
  }

  res.status(200).json({
    success: true,
    message: 'Cart retrieved successfully',
    data: { cart }
  });
});

// @desc    Add item to cart
// @route   POST /api/users/cart
// @access  Private
export const addToCart = asyncHandler(async (req, res, next) => {
  const { productId, quantity = 1 } = req.body;

  const product = await Product.findById(productId);
  if (!product) {
    return next(new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND'));
  }

  // Clean expired reservations first
  await product.cleanExpiredReservations();
  
  if (product.stock.quantity < quantity) {
    return next(new AppError('Insufficient stock', 400, 'INSUFFICIENT_STOCK'));
  }

  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    cart = await Cart.create({ user: req.user._id, items: [] });
  }

  const existingItem = cart.items.find(item => item.product.toString() === productId);
  
  if (existingItem) {
    existingItem.quantity += quantity;
    if (existingItem.quantity > product.stock.quantity) {
      return next(new AppError('Insufficient stock', 400, 'INSUFFICIENT_STOCK'));
    }
  } else {
    cart.items.push({
      product: productId,
      quantity,
      price: product.price
    });
  }

  await cart.save();
  await cart.populate('items.product', 'name price images stock status');

  res.status(200).json({
    success: true,
    message: 'Item added to cart',
    data: { cart }
  });
});

// @desc    Update cart item
// @route   PUT /api/users/cart/:itemId
// @access  Private
export const updateCartItem = asyncHandler(async (req, res, next) => {
  const { itemId } = req.params;
  const { quantity } = req.body;

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    return next(new AppError('Cart not found', 404, 'CART_NOT_FOUND'));
  }

  const item = cart.items.id(itemId);
  if (!item) {
    return next(new AppError('Cart item not found', 404, 'CART_ITEM_NOT_FOUND'));
  }

  const product = await Product.findById(item.product);
  if (product.stock.quantity < quantity) {
    return next(new AppError('Insufficient stock', 400, 'INSUFFICIENT_STOCK'));
  }

  item.quantity = quantity;
  await cart.save();
  await cart.populate('items.product', 'name price images stock status');

  res.status(200).json({
    success: true,
    message: 'Cart item updated',
    data: { cart }
  });
});

// @desc    Remove item from cart
// @route   DELETE /api/users/cart/:itemId
// @access  Private
export const removeFromCart = asyncHandler(async (req, res, next) => {
  const { itemId } = req.params;

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    return next(new AppError('Cart not found', 404, 'CART_NOT_FOUND'));
  }

  cart.items.id(itemId).remove();
  await cart.save();
  await cart.populate('items.product', 'name price images stock status');

  res.status(200).json({
    success: true,
    message: 'Item removed from cart',
    data: { cart }
  });
});

// @desc    Clear cart
// @route   DELETE /api/users/cart
// @access  Private
export const clearCart = asyncHandler(async (req, res, next) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    return next(new AppError('Cart not found', 404, 'CART_NOT_FOUND'));
  }

  cart.items = [];
  await cart.save();

  res.status(200).json({
    success: true,
    message: 'Cart cleared',
    data: { cart }
  });
});

// @desc    Get user wishlist
// @route   GET /api/users/wishlist
// @access  Private
export const getWishlist = asyncHandler(async (req, res, next) => {
  let wishlist = await Wishlist.findOne({ user: req.user._id })
    .populate('items.product', 'name price images stock status rating');

  if (!wishlist) {
    wishlist = await Wishlist.create({ user: req.user._id, items: [] });
  }

  res.status(200).json({
    success: true,
    message: 'Wishlist retrieved successfully',
    data: { wishlist }
  });
});

// @desc    Add item to wishlist
// @route   POST /api/users/wishlist/:productId
// @access  Private
export const addToWishlist = asyncHandler(async (req, res, next) => {
  const { productId } = req.params;
  const { notes } = req.body;

  const product = await Product.findById(productId);
  if (!product) {
    return next(new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND'));
  }

  let wishlist = await Wishlist.findOne({ user: req.user._id });
  if (!wishlist) {
    wishlist = await Wishlist.create({ user: req.user._id, items: [] });
  }

  const existingItem = wishlist.items.find(item => item.product.toString() === productId);
  if (existingItem) {
    return next(new AppError('Product already in wishlist', 400, 'PRODUCT_ALREADY_IN_WISHLIST'));
  }

  wishlist.items.push({
    product: productId,
    priceWhenAdded: product.price,
    notes: notes || ''
  });

  await wishlist.save();
  await wishlist.populate('items.product', 'name price images stock status rating');

  res.status(200).json({
    success: true,
    message: 'Item added to wishlist',
    data: { wishlist }
  });
});

// @desc    Remove item from wishlist
// @route   DELETE /api/users/wishlist/:productId
// @access  Private
export const removeFromWishlist = asyncHandler(async (req, res, next) => {
  const { productId } = req.params;

  const wishlist = await Wishlist.findOne({ user: req.user._id });
  if (!wishlist) {
    return next(new AppError('Wishlist not found', 404, 'WISHLIST_NOT_FOUND'));
  }

  const itemIndex = wishlist.items.findIndex(item => item.product.toString() === productId);
  if (itemIndex === -1) {
    return next(new AppError('Product not in wishlist', 404, 'PRODUCT_NOT_IN_WISHLIST'));
  }

  wishlist.items.splice(itemIndex, 1);
  await wishlist.save();
  await wishlist.populate('items.product', 'name price images stock status rating');

  res.status(200).json({
    success: true,
    message: 'Item removed from wishlist',
    data: { wishlist }
  });
});

// @desc    Update payment method
// @route   PUT /api/users/payment-methods/:id
// @access  Private
export const updatePaymentMethod = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const user = await User.findById(req.user._id);

  if (!user) {
    return next(new AppError('User not found', 404, 'USER_NOT_FOUND'));
  }

  try {
    await user.updatePaymentMethod(id, req.body);
    res.status(200).json({
      success: true,
      message: 'Payment method updated successfully',
      data: { paymentMethods: user.paymentMethods }
    });
  } catch (error) {
    return next(new AppError(error.message, 400, 'PAYMENT_METHOD_UPDATE_ERROR'));
  }
});