import express from 'express';
import { body, param } from 'express-validator';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { User } from '../models/index.js';

const router = express.Router();

// User addresses routes

// Get user addresses
router.get('/', authenticate, async (req, res) => {
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
router.post('/', [
    authenticate,
    body('type').isIn(['home', 'work', 'other']).withMessage('Address type must be home, work, or other'),
    body('firstName').notEmpty().withMessage('First name is required'),
    body('lastName').notEmpty().withMessage('Last name is required'),
    body('address').notEmpty().withMessage('Address is required'),
    body('city').notEmpty().withMessage('City is required'),
    body('postcode').notEmpty().withMessage('Postcode is required'),
    body('country').notEmpty().withMessage('Country is required'),
    validate
], async (req, res) => {
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
router.put('/:addressId', [
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
router.delete('/:addressId', [
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

export default router;