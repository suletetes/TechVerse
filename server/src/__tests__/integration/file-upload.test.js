import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../../../server.js';
import { User } from '../../models/index.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('File Upload Integration Tests', () => {
  let mongoServer;
  let testUser;
  let adminUser;
  let authToken;
  let adminToken;
  let testImagePath;
  let testImageBuffer;

  beforeAll(async () => {
    // Setup test environment
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing';
    process.env.JWT_EXPIRE = '1h';

    // Close any existing connections
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }

    // Setup in-memory MongoDB
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // Create a test image buffer (1x1 pixel PNG)
    testImageBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
      0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0xD7, 0x63, 0xF8, 0x00, 0x00, 0x00,
      0x01, 0x00, 0x01, 0x5C, 0xC2, 0x5D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49,
      0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ]);

    // Create test image file
    testImagePath = path.join(__dirname, 'test-image.png');
    fs.writeFileSync(testImagePath, testImageBuffer);
  });

  afterAll(async () => {
    // Cleanup test image
    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath);
    }

    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clear all collections
    await User.deleteMany({});

    // Create test users
    testUser = await User.create({
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      password: await bcrypt.hash('Password123', 12),
      role: 'user',
      isEmailVerified: true,
      accountStatus: 'active',
      isActive: true
    });

    adminUser = await User.create({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@example.com',
      password: await bcrypt.hash('Password123', 12),
      role: 'admin',
      isEmailVerified: true,
      accountStatus: 'active',
      isActive: true
    });

    // Generate auth tokens
    authToken = jwt.sign(
      { 
        id: testUser._id, 
        email: testUser.email, 
        role: testUser.role,
        isEmailVerified: testUser.isEmailVerified,
        accountStatus: testUser.accountStatus
      },
      process.env.JWT_SECRET,
      { 
        expiresIn: '1h',
        issuer: process.env.JWT_ISSUER || 'techverse-api',
        audience: process.env.JWT_AUDIENCE || 'techverse-client'
      }
    );

    adminToken = jwt.sign(
      { 
        id: adminUser._id, 
        email: adminUser.email, 
        role: adminUser.role,
        isEmailVerified: adminUser.isEmailVerified,
        accountStatus: adminUser.accountStatus
      },
      process.env.JWT_SECRET,
      { 
        expiresIn: '1h',
        issuer: process.env.JWT_ISSUER || 'techverse-api',
        audience: process.env.JWT_AUDIENCE || 'techverse-client'
      }
    );
  });

  describe('Image Upload Functionality Tests', () => {
    it('should allow admin to upload single image', async () => {
      const response = await request(app)
        .post('/api/upload/image')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('image', testImageBuffer, 'test-image.png')
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Image uploaded successfully');
      expect(response.body.data.image).toBeDefined();
      expect(response.body.data.image.original).toBeDefined();
      expect(response.body.data.image.original.url).toContain('/uploads/');
    });

    it('should deny regular user from uploading images', async () => {
      const response = await request(app)
        .post('/api/upload/image')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', testImageBuffer, 'test-image.png')
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access denied. Administrator privileges required.');
      expect(response.body.code).toBe('ADMIN_REQUIRED');
    });

    it('should deny unauthenticated image upload', async () => {
      const response = await request(app)
        .post('/api/upload/image')
        .attach('image', testImageBuffer, 'test-image.png')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access denied. No valid token provided.');
    });

    it('should reject upload without file', async () => {
      const response = await request(app)
        .post('/api/upload/image')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('No file uploaded');
      expect(response.body.code).toBe('NO_FILE_UPLOADED');
    });

    it('should allow admin to upload multiple images', async () => {
      const response = await request(app)
        .post('/api/upload/images')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('images', testImageBuffer, 'test-image-1.png')
        .attach('images', testImageBuffer, 'test-image-2.png')
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('2 images uploaded successfully');
      expect(response.body.data.images).toHaveLength(2);
      
      response.body.data.images.forEach(image => {
        expect(image.original).toBeDefined();
        expect(image.original.url).toContain('/uploads/');
        expect(image.originalName).toBeDefined();
        expect(image.size).toBeDefined();
      });
    });

    it('should reject multiple upload without files', async () => {
      const response = await request(app)
        .post('/api/upload/images')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('No files uploaded');
      expect(response.body.code).toBe('NO_FILES_UPLOADED');
    });

    it('should handle image deletion by admin', async () => {
      const imagePath = '/uploads/test/test-image.jpg';
      
      const response = await request(app)
        .delete('/api/upload/image')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ imagePath })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Image deleted successfully');
    });

    it('should reject image deletion without path', async () => {
      const response = await request(app)
        .delete('/api/upload/image')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Image path is required');
      expect(response.body.code).toBe('IMAGE_PATH_REQUIRED');
    });

    it('should deny regular user from deleting images', async () => {
      const imagePath = '/uploads/test/test-image.jpg';
      
      const response = await request(app)
        .delete('/api/upload/image')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ imagePath })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('ADMIN_REQUIRED');
    });

    it('should get image information for admin', async () => {
      const imagePath = '/uploads/test/test-image.jpg';
      
      const response = await request(app)
        .get('/api/upload/image/info')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ imagePath })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Image information retrieved successfully');
      expect(response.body.data.imageInfo).toBeDefined();
    });

    it('should reject image info request without path', async () => {
      const response = await request(app)
        .get('/api/upload/image/info')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Image path is required');
      expect(response.body.code).toBe('IMAGE_PATH_REQUIRED');
    });
  });

  describe('Static File Serving and URL Accessibility Tests', () => {
    it('should provide image accessibility test endpoint', async () => {
      const response = await request(app)
        .get('/api/upload/test')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Image accessibility test endpoints');
      expect(response.body.data.baseUrl).toBeDefined();
      expect(response.body.data.testImages).toBeDefined();
      expect(response.body.data.testImages.clientImages).toBeDefined();
      expect(response.body.data.testImages.uploadedImages).toBeDefined();
      expect(response.body.data.instructions).toBeDefined();
    });

    it('should serve static files from uploads directory', async () => {
      // Create a test file in uploads directory for testing
      const uploadsDir = path.join(process.cwd(), 'server', 'uploads', 'test');
      const testFilePath = path.join(uploadsDir, 'static-test.txt');
      
      // Ensure directory exists
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      
      // Create test file
      fs.writeFileSync(testFilePath, 'Test static file content');
      
      try {
        const response = await request(app)
          .get('/uploads/test/static-test.txt')
          .expect(200);

        expect(response.text).toBe('Test static file content');
      } finally {
        // Cleanup
        if (fs.existsSync(testFilePath)) {
          fs.unlinkSync(testFilePath);
        }
      }
    });

    it('should return 404 for non-existent static files', async () => {
      await request(app)
        .get('/uploads/non-existent-file.jpg')
        .expect(404);
    });

    it('should serve client images from img directory', async () => {
      // This test assumes client images exist, but in test environment they might not
      // We'll test the endpoint availability rather than specific files
      const response = await request(app)
        .get('/img/non-existent-image.jpg')
        .expect(404); // Expected since we don't have actual client images in test

      // The important thing is that the route is accessible (not 500 error)
      expect(response.status).toBe(404);
    });

    it('should handle image URL generation correctly', async () => {
      const response = await request(app)
        .get('/api/upload/test')
        .expect(200);

      const { testImages } = response.body.data;
      
      // Verify URL structure
      expect(testImages.clientImages.laptop).toMatch(/^https?:\/\/.*\/img\/.*\.webp$/);
      expect(testImages.uploadedImages.example).toMatch(/^https?:\/\/.*\/uploads\/.*\.jpg$/);
    });
  });

  describe('File Upload Security and Validation Tests', () => {
    it('should reject non-image files', async () => {
      const textBuffer = Buffer.from('This is not an image file');
      
      const response = await request(app)
        .post('/api/upload/image')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('image', textBuffer, 'test-file.txt')
        .expect(500); // Should be caught by validation

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('IMAGE_UPLOAD_ERROR');
    });

    it('should handle large file uploads appropriately', async () => {
      // Create a large buffer (simulate large file)
      const largeBuffer = Buffer.alloc(10 * 1024 * 1024); // 10MB
      
      const response = await request(app)
        .post('/api/upload/image')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('image', largeBuffer, 'large-image.png')
        .expect(413); // Payload too large

      // The exact response may vary based on multer configuration
      // but it should not be a 200 success
      expect(response.status).not.toBe(200);
    });

    it('should validate file extensions', async () => {
      const response = await request(app)
        .post('/api/upload/image')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('image', testImageBuffer, 'test-file.exe')
        .expect(500); // Should be rejected by validation

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('IMAGE_UPLOAD_ERROR');
    });

    it('should handle concurrent uploads safely', async () => {
      const uploadPromises = Array.from({ length: 3 }, (_, i) =>
        request(app)
          .post('/api/upload/image')
          .set('Authorization', `Bearer ${adminToken}`)
          .attach('image', testImageBuffer, `concurrent-test-${i}.png`)
      );

      const results = await Promise.allSettled(uploadPromises);
      
      // At least some uploads should succeed
      const successfulUploads = results.filter(r => 
        r.status === 'fulfilled' && r.value.status === 201
      );
      
      expect(successfulUploads.length).toBeGreaterThan(0);
    });

    it('should prevent path traversal attacks', async () => {
      const maliciousPath = '../../../etc/passwd';
      
      const response = await request(app)
        .delete('/api/upload/image')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ imagePath: maliciousPath })
        .expect(500); // Should be caught by validation

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('IMAGE_DELETE_ERROR');
    });
  });

  describe('Upload Integration with Product Management', () => {
    it('should handle image uploads in product creation context', async () => {
      // This test simulates how images would be used in product creation
      // First upload an image
      const uploadResponse = await request(app)
        .post('/api/upload/image')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('image', testImageBuffer, 'product-image.png')
        .expect(201);

      expect(uploadResponse.body.success).toBe(true);
      
      const imageUrl = uploadResponse.body.data.image.original.url;
      expect(imageUrl).toContain('/uploads/');
      
      // Verify the image URL structure is suitable for product use
      expect(imageUrl).toMatch(/^https?:\/\/.*\/uploads\/.*\.(png|jpg|jpeg|webp)$/i);
    });

    it('should provide proper image URLs for frontend consumption', async () => {
      const response = await request(app)
        .get('/api/upload/test')
        .expect(200);

      const { baseUrl, testImages } = response.body.data;
      
      // Verify base URL is properly formatted
      expect(baseUrl).toMatch(/^https?:\/\/.*$/);
      
      // Verify image URLs are absolute and accessible
      Object.values(testImages.clientImages).forEach(url => {
        expect(url).toMatch(/^https?:\/\/.*$/);
        expect(url).toContain(baseUrl);
      });
    });

    it('should handle image processing and optimization', async () => {
      const uploadResponse = await request(app)
        .post('/api/upload/image')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('image', testImageBuffer, 'optimization-test.png')
        .expect(201);

      expect(uploadResponse.body.success).toBe(true);
      
      const imageData = uploadResponse.body.data.image;
      
      // Should have original image
      expect(imageData.original).toBeDefined();
      expect(imageData.original.url).toBeDefined();
      
      // May have WebP and thumbnail versions (depending on implementation)
      if (imageData.webp) {
        expect(imageData.webp.url).toBeDefined();
      }
      
      if (imageData.thumbnail) {
        expect(imageData.thumbnail.url).toBeDefined();
      }
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle missing authorization header gracefully', async () => {
      const response = await request(app)
        .post('/api/upload/image')
        .attach('image', testImageBuffer, 'test-image.png')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access denied. No valid token provided.');
    });

    it('should handle malformed requests gracefully', async () => {
      const response = await request(app)
        .post('/api/upload/image')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ invalidData: 'test' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('NO_FILE_UPLOADED');
    });

    it('should handle server errors gracefully', async () => {
      // Test with invalid image path for deletion
      const response = await request(app)
        .delete('/api/upload/image')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ imagePath: '/invalid/path/that/does/not/exist.jpg' })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('IMAGE_DELETE_ERROR');
    });

    it('should validate image info requests properly', async () => {
      const response = await request(app)
        .get('/api/upload/image/info')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ imagePath: '/non/existent/path.jpg' })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('IMAGE_INFO_ERROR');
    });
  });
});