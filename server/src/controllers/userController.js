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
})  });
});ishlist }
ta: { wda
    wishlist',from d oveeme: 'Item rsagesrue,
    mccess: t({
    su00).jsonatus(2
  res.stng');
titus rastack ages storice ime pt', 'namtems.producpopulate('i wishlist.
  await();saveishlist.;
  await wdex, 1)emInce(itplist.items.s

  wishliST'));
  }_IN_WISHLIDUCT_NOT04, 'PROlist', 4n wishnot ioduct Prror('new AppErn next(retur1) {
    == -mIndex =ite);
  if (oductIding() === proStr.product.ttemtem => index(idIs.finemt.it = wishlisndextemInst i

  co;
  }OUND'))HLIST_NOT_F 404, 'WISnot found',shlist Wiror('ew AppErnext(n   return list) {
  (!wish);
  ifr._id } req.user: usene({findOst.hli = await Wist wishlist

  consarams;Id } = req.pctrodut { pns co=> {
 , next) , resnc (reqsyandler(aist = asyncHveFromWishlt const remoate
exporess  Priv
// @accproductIdhlist/:i/users/wis DELETE /apoute  
// @rhlistem from wis itc    Removees;

// 