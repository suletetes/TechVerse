import { jest } from '@jest/globals';
import mongoose from 'mongoose';
import { Product } from '../../../src/models/index.js';

describe('Product Model', () => {
  beforeEach(async () => {
    // Clear products collection before each test
    await Product.deleteMany({});
  });

  describe('Product Creation', () => {
    it('should create a product with valid data', async () => {
      const productData = {
        name: 'Test Product',
        description: 'This is a test product',
        price: 99.99,
        category: new mongoose.Types.ObjectId(),
        brand: 'Test Brand',
        createdBy: new mongoose.Types.ObjectId(),
        stock: {
          quantity: 10,
          trackQuantity: true
        }
      };

      const product = new Product(productData);
      const savedProduct = await product.save();

      expect(savedProduct._id).toBeDefined();
      expect(savedProduct.name).toBe(productData.name);
      expect(savedProduct.slug).toBe('test-product');
      expect(savedProduct.status).toBe('draft'); // default value
    });

    it('should require mandatory fields', async () => {
      const product = new Product({});

      let error;
      try {
        await product.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors.name).toBeDefined();
      expect(error.errors.description).toBeDefined();
      expect(error.errors.price).toBeDefined();
      expect(error.errors.category).toBeDefined();
      expect(error.errors.brand).toBeDefined();
      expect(error.errors.createdBy).toBeDefined();
    });

    it('should generate unique slug', async () => {
      const productData = {
        name: 'Test Product',
        description: 'Description',
        price: 99.99,
        category: new mongoose.Types.ObjectId(),
        brand: 'Test Brand',
        createdBy: new mongoose.Types.ObjectId()
      };

      const product1 = new Product(productData);
      const product2 = new Product({ ...productData, name: 'Test Product!' });

      await product1.save();
      await product2.save();

      expect(product1.slug).toBe('test-product');
      expect(product2.slug).toContain('test-product');
    });
  });

  describe('Product Methods', () => {
    let product;

    beforeEach(async () => {
      product = new Product({
        name: 'Test Product',
        description: 'Test description',
        price: 99.99,
        category: new mongoose.Types.ObjectId(),
        brand: 'Test Brand',
        createdBy: new mongoose.Types.ObjectId(),
        stock: {
          quantity: 10,
          trackQuantity: true
        }
      });
      await product.save();
    });

    describe('isAvailable', () => {
      it('should return true for available product', () => {
        product.status = 'active';
        product.visibility = 'public';
        product.stock.quantity = 5;

        expect(product.isAvailable(3)).toBe(true);
      });

      it('should return false for inactive product', () => {
        product.status = 'inactive';
        product.visibility = 'public';
        product.stock.quantity = 5;

        expect(product.isAvailable(3)).toBe(false);
      });

      it('should return false for insufficient stock', () => {
        product.status = 'active';
        product.visibility = 'public';
        product.stock.quantity = 2;

        expect(product.isAvailable(5)).toBe(false);
      });

      it('should return true when not tracking quantity', () => {
        product.status = 'active';
        product.visibility = 'public';
        product.stock.trackQuantity = false;
        product.stock.quantity = 0;

        expect(product.isAvailable(100)).toBe(true);
      });
    });

    describe('reserveStock', () => {
      it('should reserve stock successfully', async () => {
        const testProduct = await Product.findById(product._id);
        const initialQuantity = testProduct.stock.quantity;
        await testProduct.reserveStock(3);

        expect(testProduct.stock.quantity).toBe(initialQuantity - 3);
      });

      it('should throw error for insufficient stock', async () => {
        const testProduct = await Product.findById(product._id);
        try {
          await testProduct.reserveStock(1000);
          fail('Should have thrown an error');
        } catch (error) {
          expect(error.message).toContain('Insufficient stock');
        }
      });

      it('should not affect stock when not tracking quantity', async () => {
        const testProduct = await Product.findById(product._id);
        testProduct.stock.trackQuantity = false;
        const initialQuantity = testProduct.stock.quantity;
        
        await testProduct.reserveStock(100);
        
        expect(testProduct.stock.quantity).toBe(initialQuantity);
      });
    });

    describe('addToSection', () => {
      it('should add product to section', async () => {
        await product.addToSection('featured');
        
        expect(product.sections).toContain('featured');
      });

      it('should not add duplicate sections', async () => {
        await product.addToSection('featured');
        await product.addToSection('featured');
        
        const featuredCount = product.sections.filter(s => s === 'featured').length;
        expect(featuredCount).toBe(1);
      });
    });

    describe('removeFromSection', () => {
      it('should remove product from section', async () => {
        product.sections = ['featured', 'topSeller'];
        await product.removeFromSection('featured');
        
        expect(product.sections).not.toContain('featured');
        expect(product.sections).toContain('topSeller');
      });
    });
  });

  describe('Product Virtuals', () => {
    let product;

    beforeEach(() => {
      product = new Product({
        name: 'Test Product',
        description: 'Test description',
        price: 80,
        comparePrice: 100,
        category: new mongoose.Types.ObjectId(),
        brand: 'Test Brand',
        createdBy: new mongoose.Types.ObjectId(),
        stock: {
          quantity: 5,
          lowStockThreshold: 10,
          trackQuantity: true
        },
        images: [
          { url: 'image1.jpg', isPrimary: false },
          { url: 'image2.jpg', isPrimary: true },
          { url: 'image3.jpg', isPrimary: false }
        ]
      });
    });

    describe('discountPercentage', () => {
      it('should calculate discount percentage correctly', () => {
        expect(product.discountPercentage).toBe(20); // (100-80)/100 * 100
      });

      it('should return 0 when no compare price', () => {
        product.comparePrice = undefined;
        expect(product.discountPercentage).toBe(0);
      });

      it('should return 0 when compare price is lower than price', () => {
        product.comparePrice = 70;
        expect(product.discountPercentage).toBe(0);
      });
    });

    describe('stockStatus', () => {
      it('should return "in_stock" for normal stock', () => {
        product.stock.quantity = 15;
        expect(product.stockStatus).toBe('in_stock');
      });

      it('should return "low_stock" when below threshold', () => {
        product.stock.quantity = 5;
        expect(product.stockStatus).toBe('low_stock');
      });

      it('should return "out_of_stock" when quantity is 0', () => {
        product.stock.quantity = 0;
        expect(product.stockStatus).toBe('out_of_stock');
      });

      it('should return "in_stock" when not tracking quantity', () => {
        product.stock.trackQuantity = false;
        product.stock.quantity = 0;
        expect(product.stockStatus).toBe('in_stock');
      });
    });

    describe('primaryImage', () => {
      it('should return primary image when available', () => {
        const primaryImage = product.primaryImage;
        expect(primaryImage.url).toBe('image2.jpg');
        expect(primaryImage.isPrimary).toBe(true);
      });

      it('should return first image when no primary image', () => {
        product.images.forEach(img => img.isPrimary = false);
        const primaryImage = product.primaryImage;
        expect(primaryImage.url).toBe('image1.jpg');
      });

      it('should return null when no images', () => {
        product.images = [];
        expect(product.primaryImage).toBeNull();
      });
    });
  });
});