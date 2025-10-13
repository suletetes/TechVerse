import { Store } from '../models/index.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';

// @desc    Get all active stores
// @route   GET /api/stores
// @access  Public
export const getStores = asyncHandler(async (req, res, next) => {
  const stores = await Store.find({ isActive: true })
    .sort({ displayOrder: 1, name: 1 });

  res.status(200).json({
    success: true,
    message: 'Stores retrieved successfully',
    data: { stores }
  });
});

// @desc    Get store by ID or slug
// @route   GET /api/stores/:id
// @access  Public
export const getStoreById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  let store = await Store.findById(id);

  if (!store) {
    store = await Store.findOne({ slug: id, isActive: true });
  }

  if (!store) {
    return next(new AppError('Store not found', 404, 'STORE_NOT_FOUND'));
  }

  res.status(200).json({
    success: true,
    message: 'Store retrieved successfully',
    data: { store }
  });
});