import express from 'express';
import { body, param } from 'express-validator';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { User } from '../models/index.js';



const router = express.Router();

// UserProfile routes

// Test route to verify userProfile routes are working
router.get('/test', (_req, res) => {
    console.log('=== TEST ROUTE HIT ===');
    res.json({ success: true, message: 'UserProfile routes are working' });
});

// Simple addresses test without auth
router.get('/addresses-test', (req, res) => {
    console.log('=== ADDRESSES TEST ROUTE HIT ===');
    res.json({ success: true, message: 'Addresses test route working' });
});

// Simple addresses route without middleware for testing
router.get('/addresses-simple', (req, res) => {
    console.log('=== SIMPLE ADDRESSES ROUTE HIT ===');
    res.json({
        success: true,
        data: { addresses: [] },
        message: 'Simple addresses route working'
    });
});

// Test route with authentication
router.get('/addresses-auth-test', authenticate, (req, res) => {
    console.log('=== AUTH TEST ROUTE HIT ===');
    res.json({
        success: true,
        message: 'Auth test route working',
        userId: req.user.id
    });
});

// Simple POST test
router.post('/addresses-test', authenticate, (req, res) => {
    console.log('=== POST TEST ROUTE HIT ===');
    res.json({
        success: true,
        message: 'POST test route working',
        body: req.body
    });
});

// Get user addresses (working version)
router.get('/addresses', authenticate, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('addresses');

        res.json({
            success: true,
            data: { addresses: user?.addresses || [] }
        });
    } catch (error) {
        console.error('Error fetching addresses:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch addresses'
        });
    }
});

// Add new address
router.post('/addresses', authenticate, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        await user.addAddress(req.body);

        res.json({
            success: true,
            message: 'Address added successfully',
            data: { addresses: user.addresses }
        });
    } catch (error) {
        console.error('Error adding address:', error);

        // Handle validation errors
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => ({
                field: err.path,
                message: err.message
            }));
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: validationErrors
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to add address'
        });
    }
});

// Update address
router.put('/addresses/:addressId', [
    authenticate,
    param('addressId').isMongoId().withMessage('Valid address ID is required'),
    validate
], async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        await user.updateAddress(req.params.addressId, req.body);

        res.json({
            success: true,
            message: 'Address updated successfully',
            data: { addresses: user.addresses }
        });
    } catch (error) {
        console.error('Error updating address:', error);
        if (error.message === 'Address not found') {
            return res.status(404).json({
                success: false,
                message: 'Address not found'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Failed to update address'
        });
    }
});

// Delete address
router.delete('/addresses/:addressId', [
    authenticate,
    param('addressId').isMongoId().withMessage('Valid address ID is required'),
    validate
], async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        await user.removeAddress(req.params.addressId);

        res.json({
            success: true,
            message: 'Address deleted successfully',
            data: { addresses: user.addresses }
        });
    } catch (error) {
        console.error('Error deleting address:', error);
        if (error.message === 'Address not found') {
            return res.status(404).json({
                success: false,
                message: 'Address not found'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Failed to delete address'
        });
    }
});

// Get user payment methods
router.get('/payment-methods', authenticate, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('paymentMethods');
        // Don't expose sensitive payment data
        const sanitizedMethods = user.paymentMethods.map(method => ({
            _id: method._id,
            type: method.type,
            brand: method.brand,
            last4: method.last4,
            expiryMonth: method.expiryMonth,
            expiryYear: method.expiryYear,
            holderName: method.holderName,
            isDefault: method.isDefault,
            createdAt: method.createdAt
        }));

        res.json({
            success: true,
            data: { paymentMethods: sanitizedMethods }
        });
    } catch (error) {
        console.error('Error fetching payment methods:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch payment methods'
        });
    }
});

// Add payment method (simplified - in production would integrate with Stripe/PayPal)
router.post('/payment-methods', [
    authenticate,
    body('type').isIn(['card', 'paypal']).withMessage('Payment type must be card or paypal'),
    body('holderName').notEmpty().withMessage('Cardholder name is required'),
    validate
], async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        // In production, this would integrate with payment processors
        const paymentMethodData = {
            ...req.body,
            // Mock data for demo - in production these would come from Stripe/PayPal
            last4: req.body.last4 || '1234',
            brand: req.body.brand || 'visa',
            expiryMonth: req.body.expiryMonth || 12,
            expiryYear: req.body.expiryYear || 2025
        };

        await user.addPaymentMethod(paymentMethodData);

        res.json({
            success: true,
            message: 'Payment method added successfully'
        });
    } catch (error) {
        console.error('Error adding payment method:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add payment method'
        });
    }
});

// Delete payment method
router.delete('/payment-methods/:methodId', [
    authenticate,
    param('methodId').isMongoId().withMessage('Valid payment method ID is required'),
    validate
], async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        await user.removePaymentMethod(req.params.methodId);

        res.json({
            success: true,
            message: 'Payment method deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting payment method:', error);
        if (error.message === 'Payment method not found') {
            return res.status(404).json({
                success: false,
                message: 'Payment method not found'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Failed to delete payment method'
        });
    }
});

export default router;