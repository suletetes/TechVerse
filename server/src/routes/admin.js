import express from 'express';
import {
  getDashboardStats,
  getHomepageSections,
  updateHomepageSection,
  getHomepageSectionsPreview,
  getStores,
  createStore,
  updateStore,
  deleteStore
} from '../controllers/adminController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// All routes require admin authentication
router.use(authenticate, requireAdmin);

// Dashboard routes
router.get('/dashboard', getDashboardStats);

// Homepage sections management
router.get('/sections', getHomepageSections);
router.get('/sections/preview', getHomepageSectionsPreview);
router.put('/sections/:sectionType', updateHomepageSection);

// Store management
router.get('/stores', getStores);
router.post('/stores', createStore);
router.put('/stores/:id', updateStore);
router.delete('/stores/:id', deleteStore);

export default router;