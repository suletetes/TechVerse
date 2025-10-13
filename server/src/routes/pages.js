import express from 'express';
import { getPages, getPageBySlug } from '../controllers/pageController.js';

const router = express.Router();

// Public routes
router.get('/', getPages);
router.get('/:slug', getPageBySlug);

export default router;