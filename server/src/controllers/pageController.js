import { Page } from '../models/index.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';

// @desc    Get page by slug
// @route   GET /api/pages/:slug
// @access  Public
export const getPageBySlug = asyncHandler(async (req, res, next) => {
  const { slug } = req.params;

  const page = await Page.getBySlug(slug);

  if (!page) {
    return next(new AppError('Page not found', 404, 'PAGE_NOT_FOUND'));
  }

  res.status(200).json({
    success: true,
    message: 'Page retrieved successfully',
    data: { page }
  });
});

// @desc    Get all published pages
// @route   GET /api/pages
// @access  Public
export const getPages = asyncHandler(async (req, res, next) => {
  const pages = await Page.find({ isPublished: true })
    .select('slug title excerpt updatedAt')
    .sort({ updatedAt: -1 });

  res.status(200).json({
    success: true,
    message: 'Pages retrieved successfully',
    data: { pages }
  });
});