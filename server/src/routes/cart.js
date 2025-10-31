import express from 'express';
import { Cart } from '../models/index.js';
import { authenticate } from '../middleware/auth.js';
import { validateCartItem } from '../middleware/validation.js';
import { Product } from '../models/index.js';

const router = express.Router();

// Get user's cart
router.get('/', authenticate, async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.user._id })
            .populate({
                path: 'items.product',
                select: 'name price images stock variants status'
            });

        if (!cart) {
            return res.json({
                success: true,
                data: {
                    items: [],
                    totalItems: 0,
                    totalAmount: 0
                }
            });
        }

        // Calculate totals and validate stock
        let totalAmount = 0;
        const validItems = [];

        for (const item of cart.items) {
            if (item.product && item.product.status === 'active') {
                const itemPrice = item.product.price + (item.priceModifier || 0);
                totalAmount += itemPrice * item.quantity;
                validItems.push({
                    ...item.toObject(),
                    itemPrice,
                    totalPrice: itemPrice * item.quantity
                });
            }
        }

        res.json({
            success: true,
            data: {
                items: validItems,
                totalItems: validItems.reduce((sum, item) => sum + item.quantity, 0),
                totalAmount
            }
        });
    } catch (error) {
        console.error('Get cart error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve cart',
            error: error.message
        });
    }
});

// Add item to cart
router.post('/add', authenticate, validateCartItem, async (req, res) => {
    try {
        const { productId, quantity = 1, options = {} } = req.body;

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

        // Find or create cart
        let cart = await Cart.findOne({ user: req.user._id });
        if (!cart) {
            cart = new Cart({ user: req.user._id, items: [] });
        }

        // Check if item already exists in cart
        const existingItemIndex = cart.items.findIndex(item => 
            item.product.toString() === productId &&
            JSON.stringify(item.options) === JSON.stringify(options)
        );

        if (existingItemIndex > -1) {
            // Update existing item quantity
            const newQuantity = cart.items[existingItemIndex].quantity + quantity;
            
            // Check stock for new quantity
            if (product.stock && product.stock.trackQuantity && product.stock.quantity < newQuantity) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot add more items. Insufficient stock.',
                    availableStock: product.stock.quantity,
                    currentInCart: cart.items[existingItemIndex].quantity
                });
            }
            
            cart.items[existingItemIndex].quantity = newQuantity;
        } else {
            // Add new item to cart
            cart.items.push({
                product: productId,
                quantity,
                options,
                priceModifier: calculatePriceModifier(product, options),
                price: product.price
            });
        }

        cart.updatedAt = new Date();
        await cart.save();

        // Populate and return updated cart
        await cart.populate({
            path: 'items.product',
            select: 'name price images stock variants status'
        });

        res.json({
            success: true,
            message: 'Item added to cart successfully',
            data: cart
        });
    } catch (error) {
        console.error('Add to cart error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add item to cart',
            error: error.message
        });
    }
});

// Update cart item quantity
router.put('/update/:itemId', authenticate, async (req, res) => {
    try {
        const { itemId } = req.params;
        const { quantity } = req.body;

        if (!quantity || quantity < 1) {
            return res.status(400).json({
                success: false,
                message: 'Quantity must be at least 1'
            });
        }

        const cart = await Cart.findOne({ user: req.user._id });
        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            });
        }

        const itemIndex = cart.items.findIndex(item => item._id.toString() === itemId);
        if (itemIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Item not found in cart'
            });
        }

        // Validate stock
        const product = await Product.findById(cart.items[itemIndex].product);
        if (product && product.stock && product.stock.trackQuantity) {
            if (product.stock.quantity < quantity) {
                return res.status(400).json({
                    success: false,
                    message: 'Insufficient stock available',
                    availableStock: product.stock.quantity
                });
            }
        }

        cart.items[itemIndex].quantity = quantity;
        cart.updatedAt = new Date();
        await cart.save();

        await cart.populate({
            path: 'items.product',
            select: 'name price images stock variants status'
        });

        res.json({
            success: true,
            message: 'Cart item updated successfully',
            data: cart
        });
    } catch (error) {
        console.error('Update cart error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update cart item',
            error: error.message
        });
    }
});

// Remove item from cart
router.delete('/remove/:itemId', authenticate, async (req, res) => {
    try {
        const { itemId } = req.params;

        const cart = await Cart.findOne({ user: req.user._id });
        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            });
        }

        cart.items = cart.items.filter(item => item._id.toString() !== itemId);
        cart.updatedAt = new Date();
        await cart.save();

        await cart.populate({
            path: 'items.product',
            select: 'name price images stock variants status'
        });

        res.json({
            success: true,
            message: 'Item removed from cart successfully',
            data: cart
        });
    } catch (error) {
        console.error('Remove from cart error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to remove item from cart',
            error: error.message
        });
    }
});

// Clear entire cart
router.delete('/clear', authenticate, async (req, res) => {
    try {
        await Cart.findOneAndUpdate(
            { user: req.user._id },
            { items: [], updatedAt: new Date() },
            { new: true }
        );

        res.json({
            success: true,
            message: 'Cart cleared successfully',
            data: {
                items: [],
                totalItems: 0,
                totalAmount: 0
            }
        });
    } catch (error) {
        console.error('Clear cart error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to clear cart',
            error: error.message
        });
    }
});

// Validate cart before checkout
router.post('/validate', authenticate, async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.user._id })
            .populate('items.product');

        if (!cart || cart.items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Cart is empty'
            });
        }

        const validationErrors = [];
        const validItems = [];
        let totalAmount = 0;

        for (const item of cart.items) {
            const product = item.product;
            
            // Check if product is still active
            if (!product || product.status !== 'active') {
                validationErrors.push({
                    itemId: item._id,
                    error: 'Product is no longer available'
                });
                continue;
            }

            // Check stock availability
            if (product.stock && product.stock.trackQuantity) {
                if (product.stock.quantity < item.quantity) {
                    validationErrors.push({
                        itemId: item._id,
                        error: `Only ${product.stock.quantity} items available`,
                        availableStock: product.stock.quantity
                    });
                    continue;
                }
            }

            const itemPrice = product.price + (item.priceModifier || 0);
            totalAmount += itemPrice * item.quantity;
            validItems.push(item);
        }

        res.json({
            success: validationErrors.length === 0,
            message: validationErrors.length === 0 ? 'Cart is valid' : 'Cart validation failed',
            data: {
                validItems,
                totalAmount,
                validationErrors
            }
        });
    } catch (error) {
        console.error('Validate cart error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to validate cart',
            error: error.message
        });
    }
});

// Helper function to calculate price modifier based on options
function calculatePriceModifier(product, options) {
    let modifier = 0;
    
    if (product.variants && options) {
        for (const variant of product.variants) {
            const selectedOption = options[variant.name.toLowerCase()];
            if (selectedOption) {
                const option = variant.options.find(opt => opt.value === selectedOption);
                if (option && option.priceModifier) {
                    modifier += option.priceModifier;
                }
            }
        }
    }
    
    return modifier;
}

export default router;