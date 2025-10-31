import express from 'express';
import { Wishlist, Product } from '../models/index.js';
import { authenticate } from '../middleware/auth.js';
import { body, param } from 'express-validator';
import { validate } from '../middleware/validation.js';

const router = express.Router();

// Validation middleware for wishlist operations
const validateProductId = [
    param('productId')
        .isMongoId()
        .withMessage('Invalid product ID format'),
    validate
];

const validateWishlistAdd = [
    body('notes')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Notes must be less than 500 characters'),
    validate
];

const validateWishlistSync = [
    body('productIds')
        .isArray({ min: 1, max: 100 })
        .withMessage('Product IDs must be an array with 1-100 items'),
    body('productIds.*')
        .isMongoId()
        .withMessage('Each product ID must be valid'),
    validate
];

// Get user's wishlist
router.get('/', authenticate, async (req, res) => {
    try {
        const wishlist = await Wishlist.findOne({ user: req.user._id })
            .populate({
                path: 'items.product',
                select: 'name price images stock variants status category brand discountPercentage compareAtPrice'
            })
            .lean();

        if (!wishlist) {
            return res.json({
                success: true,
                data: {
                    items: [],
                    totalItems: 0
                }
            });
        }

        // Filter out inactive products and add computed fields
        const validItems = wishlist.items
            .filter(item => item.product && item.product.status === 'active')
            .map(item => ({
                ...item,
                product: {
                    ...item.product,
                    primaryImage: item.product.images?.find(img => img.isPrimary) || item.product.images?.[0],
                    finalPrice: item.product.discountPercentage > 0 
                        ? item.product.price * (1 - item.product.discountPercentage / 100)
                        : item.product.price,
                    stockStatus: item.product.stock?.trackQuantity 
                        ? (item.product.stock.quantity > item.product.stock.lowStockThreshold ? 'in_stock' 
                           : item.product.stock.quantity > 0 ? 'low_stock' : 'out_of_stock')
                        : 'in_stock'
                }
            }));

        res.json({
            success: true,
            data: {
                items: validItems,
                totalItems: validItems.length
            }
        });
    } catch (error) {
        console.error('Get wishlist error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve wishlist',
            error: error.message
        });
    }
});

// Add product to wishlist
router.post('/add/:productId', authenticate, validateProductId, validateWishlistAdd, async (req, res) => {
    try {
        const { productId } = req.params;
        const { notes = '' } = req.body;

        // Validate product exists and is active
        const product = await Product.findById(productId);
        if (!product || product.status !== 'active') {
            return res.status(404).json({
                success: false,
                message: 'Product not found or unavailable'
            });
        }

        // Find or create wishlist
        let wishlist = await Wishlist.findOne({ user: req.user._id });
        if (!wishlist) {
            wishlist = new Wishlist({ user: req.user._id, items: [] });
        }

        // Check if product already exists in wishlist
        const existingItemIndex = wishlist.items.findIndex(item => 
            item.product.toString() === productId
        );

        if (existingItemIndex > -1) {
            // Update existing item notes if provided
            if (notes) {
                wishlist.items[existingItemIndex].notes = notes;
                await wishlist.save();
            }
            
            return res.status(409).json({
                success: false,
                message: 'Product is already in your wishlist'
            });
        }

        // Add new item to wishlist
        wishlist.items.unshift({
            product: productId,
            priceWhenAdded: product.price,
            notes
        });

        await wishlist.save();

        // Populate and return the new item
        await wishlist.populate({
            path: 'items.product',
            select: 'name price images stock variants status category brand discountPercentage compareAtPrice'
        });

        const newItem = wishlist.items[0];
        const responseItem = {
            ...newItem.toObject(),
            product: {
                ...newItem.product.toObject(),
                primaryImage: newItem.product.images?.find(img => img.isPrimary) || newItem.product.images?.[0],
                finalPrice: newItem.product.discountPercentage > 0 
                    ? newItem.product.price * (1 - newItem.product.discountPercentage / 100)
                    : newItem.product.price,
                stockStatus: newItem.product.stock?.trackQuantity 
                    ? (newItem.product.stock.quantity > newItem.product.stock.lowStockThreshold ? 'in_stock' 
                       : newItem.product.stock.quantity > 0 ? 'low_stock' : 'out_of_stock')
                    : 'in_stock'
            }
        };

        res.status(201).json({
            success: true,
            message: 'Product added to wishlist successfully',
            data: responseItem
        });
    } catch (error) {
        console.error('Add to wishlist error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add product to wishlist',
            error: error.message
        });
    }
});

// Remove product from wishlist
router.delete('/remove/:productId', authenticate, validateProductId, async (req, res) => {
    try {
        const { productId } = req.params;

        const wishlist = await Wishlist.findOne({ user: req.user._id });
        if (!wishlist) {
            return res.status(404).json({
                success: false,
                message: 'Wishlist not found'
            });
        }

        const initialLength = wishlist.items.length;
        wishlist.items = wishlist.items.filter(item => 
            item.product.toString() !== productId
        );

        if (wishlist.items.length === initialLength) {
            return res.status(404).json({
                success: false,
                message: 'Product not found in wishlist'
            });
        }

        await wishlist.save();

        res.json({
            success: true,
            message: 'Product removed from wishlist successfully',
            data: {
                removedProductId: productId,
                totalItems: wishlist.items.length
            }
        });
    } catch (error) {
        console.error('Remove from wishlist error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to remove product from wishlist',
            error: error.message
        });
    }
});

// Clear entire wishlist
router.delete('/clear', authenticate, async (req, res) => {
    try {
        await Wishlist.findOneAndUpdate(
            { user: req.user._id },
            { items: [] },
            { new: true, upsert: true }
        );

        res.json({
            success: true,
            message: 'Wishlist cleared successfully',
            data: {
                items: [],
                totalItems: 0
            }
        });
    } catch (error) {
        console.error('Clear wishlist error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to clear wishlist',
            error: error.message
        });
    }
});

// Move product from wishlist to cart
router.post('/move-to-cart/:productId', authenticate, validateProductId, async (req, res) => {
    try {
        const { productId } = req.params;
        const { quantity = 1, options = {} } = req.body;

        // Validate product exists and is active
        const product = await Product.findById(productId);
        if (!product || product.status !== 'active') {
            return res.status(404).json({
                success: false,
                message: 'Product not found or unavailable'
            });
        }

        // Check stock availability
        if (product.stock && product.stock.trackQuantity) {
            if (product.stock.quantity < quantity) {
                return res.status(400).json({
                    success: false,
                    message: 'Insufficient stock available',
                    availableStock: product.stock.quantity
                });
            }
        }

        // Import Cart model dynamically to avoid circular dependency
        const { Cart } = await import('../models/index.js');

        // Find or create cart
        let cart = await Cart.findOne({ user: req.user._id });
        if (!cart) {
            cart = new Cart({ user: req.user._id, items: [] });
        }

        // Check if item already exists in cart
        const existingCartItemIndex = cart.items.findIndex(item => 
            item.product.toString() === productId &&
            JSON.stringify(item.options) === JSON.stringify(options)
        );

        if (existingCartItemIndex > -1) {
            // Update existing cart item quantity
            const newQuantity = cart.items[existingCartItemIndex].quantity + quantity;
            
            // Check stock for new quantity
            if (product.stock && product.stock.trackQuantity && product.stock.quantity < newQuantity) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot add more items. Insufficient stock.',
                    availableStock: product.stock.quantity,
                    currentInCart: cart.items[existingCartItemIndex].quantity
                });
            }
            
            cart.items[existingCartItemIndex].quantity = newQuantity;
        } else {
            // Add new item to cart
            cart.items.push({
                product: productId,
                quantity,
                options,
                priceModifier: 0, // Calculate if needed
                price: product.price
            });
        }

        // Remove from wishlist
        const wishlist = await Wishlist.findOne({ user: req.user._id });
        if (wishlist) {
            wishlist.items = wishlist.items.filter(item => 
                item.product.toString() !== productId
            );
            await wishlist.save();
        }

        // Save cart
        await cart.save();

        res.json({
            success: true,
            message: 'Product moved to cart successfully',
            data: {
                movedProductId: productId,
                cartItemsCount: cart.items.length,
                wishlistItemsCount: wishlist ? wishlist.items.length : 0
            }
        });
    } catch (error) {
        console.error('Move to cart error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to move product to cart',
            error: error.message
        });
    }
});

// Check if product is in wishlist
router.get('/check/:productId', authenticate, validateProductId, async (req, res) => {
    try {
        const { productId } = req.params;

        const wishlist = await Wishlist.findOne({ user: req.user._id });
        const isInWishlist = wishlist ? 
            wishlist.items.some(item => item.product.toString() === productId) : 
            false;

        res.json({
            success: true,
            data: {
                productId,
                isInWishlist,
                addedAt: isInWishlist ? 
                    wishlist.items.find(item => item.product.toString() === productId)?.addedAt : 
                    null
            }
        });
    } catch (error) {
        console.error('Check wishlist error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check wishlist status',
            error: error.message
        });
    }
});

// Get wishlist summary (count only)
router.get('/summary', authenticate, async (req, res) => {
    try {
        const wishlist = await Wishlist.findOne({ user: req.user._id });
        const totalItems = wishlist ? wishlist.items.length : 0;

        res.json({
            success: true,
            data: {
                totalItems,
                hasItems: totalItems > 0
            }
        });
    } catch (error) {
        console.error('Get wishlist summary error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get wishlist summary',
            error: error.message
        });
    }
});

// Sync wishlist with product IDs (for guest to user conversion)
router.post('/sync', authenticate, validateWishlistSync, async (req, res) => {
    try {
        const { productIds } = req.body;

        // Validate all products exist and are active
        const products = await Product.find({ 
            _id: { $in: productIds }, 
            status: 'active' 
        });

        if (products.length !== productIds.length) {
            const foundIds = products.map(p => p._id.toString());
            const invalidIds = productIds.filter(id => !foundIds.includes(id));
            
            return res.status(400).json({
                success: false,
                message: 'Some products are invalid or unavailable',
                invalidProductIds: invalidIds
            });
        }

        // Find or create wishlist
        let wishlist = await Wishlist.findOne({ user: req.user._id });
        if (!wishlist) {
            wishlist = new Wishlist({ user: req.user._id, items: [] });
        }

        // Get existing product IDs in wishlist
        const existingProductIds = wishlist.items.map(item => item.product.toString());

        // Add only new products
        const newProductIds = productIds.filter(id => !existingProductIds.includes(id));
        const newItems = newProductIds.map(productId => {
            const product = products.find(p => p._id.toString() === productId);
            return {
                product: productId,
                priceWhenAdded: product.price,
                notes: ''
            };
        });

        // Add new items to the beginning of the wishlist
        wishlist.items.unshift(...newItems);
        await wishlist.save();

        res.json({
            success: true,
            message: 'Wishlist synced successfully',
            data: {
                totalItems: wishlist.items.length,
                newItemsAdded: newItems.length,
                skippedItems: productIds.length - newItems.length
            }
        });
    } catch (error) {
        console.error('Sync wishlist error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to sync wishlist',
            error: error.message
        });
    }
});

export default router;