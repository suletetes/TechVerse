#!/usr/bin/env node

/**
 * Script to combine Postman collection parts into a complete collection
 */

import fs from 'fs';
import path from 'path';

// Read the base collection structure
const baseCollection = JSON.parse(fs.readFileSync('postman-collection-part1.json', 'utf8'));

// Read all the additional parts
const parts = [
  'postman-collection-part2.json', // Products
  'postman-collection-part3.json', // Cart Management
  'postman-collection-part4.json', // Wishlist
  'postman-collection-part5.json', // Orders
  'postman-collection-part6.json', // Reviews
  'postman-collection-part7.json'  // Admin - Products
];

// Add each part to the base collection
parts.forEach(partFile => {
  if (fs.existsSync(partFile)) {
    const part = JSON.parse(fs.readFileSync(partFile, 'utf8'));
    baseCollection.item.push(part);
  }
});

// Add additional admin sections
const adminSections = [
  {
    "name": "Admin - Dashboard",
    "item": [
      {
        "name": "Get Dashboard Analytics",
        "request": {
          "method": "GET",
          "header": [
            {
              "key": "Authorization",
              "value": "Bearer {{authToken}}"
            }
          ],
          "url": {
            "raw": "{{baseUrl}}/admin/dashboard",
            "host": ["{{baseUrl}}"],
            "path": ["admin", "dashboard"]
          }
        }
      }
    ]
  },
  {
    "name": "Admin - Orders",
    "item": [
      {
        "name": "Get All Orders (Admin)",
        "request": {
          "method": "GET",
          "header": [
            {
              "key": "Authorization",
              "value": "Bearer {{authToken}}"
            }
          ],
          "url": {
            "raw": "{{baseUrl}}/admin/orders?page=1&limit=20&status=pending",
            "host": ["{{baseUrl}}"],
            "path": ["admin", "orders"],
            "query": [
              {
                "key": "page",
                "value": "1"
              },
              {
                "key": "limit",
                "value": "20"
              },
              {
                "key": "status",
                "value": "pending",
                "disabled": true
              }
            ]
          }
        }
      },
      {
        "name": "Update Order Status",
        "request": {
          "method": "PUT",
          "header": [
            {
              "key": "Authorization",
              "value": "Bearer {{authToken}}"
            },
            {
              "key": "Content-Type",
              "value": "application/json"
            }
          ],
          "body": {
            "mode": "raw",
            "raw": "{\n  \"status\": \"processing\",\n  \"note\": \"Payment confirmed, preparing for shipment\",\n  \"notifyCustomer\": true\n}"
          },
          "url": {
            "raw": "{{baseUrl}}/admin/orders/{{orderId}}/status",
            "host": ["{{baseUrl}}"],
            "path": ["admin", "orders", "{{orderId}}", "status"]
          }
        }
      }
    ]
  },
  {
    "name": "Categories",
    "item": [
      {
        "name": "Get All Categories",
        "request": {
          "method": "GET",
          "header": [],
          "url": {
            "raw": "{{baseUrl}}/categories",
            "host": ["{{baseUrl}}"],
            "path": ["categories"]
          }
        }
      },
      {
        "name": "Get Category by Slug",
        "request": {
          "method": "GET",
          "header": [],
          "url": {
            "raw": "{{baseUrl}}/categories/:slug?page=1&limit=20",
            "host": ["{{baseUrl}}"],
            "path": ["categories", ":slug"],
            "query": [
              {
                "key": "page",
                "value": "1"
              },
              {
                "key": "limit",
                "value": "20"
              }
            ],
            "variable": [
              {
                "key": "slug",
                "value": "smartphones"
              }
            ]
          }
        }
      }
    ]
  }
];

// Add admin sections to the collection
adminSections.forEach(section => {
  baseCollection.item.push(section);
});

// Write the complete collection
const completeCollection = JSON.stringify(baseCollection, null, 2);
fs.writeFileSync('TechVerse-API-Complete.postman_collection.json', completeCollection);

console.log('✅ Complete Postman collection created: TechVerse-API-Complete.postman_collection.json');
console.log(`📊 Collection contains ${baseCollection.item.length} main sections`);

// Count total requests
let totalRequests = 0;
function countRequests(items) {
  items.forEach(item => {
    if (item.request) {
      totalRequests++;
    } else if (item.item) {
      countRequests(item.item);
    }
  });
}

countRequests(baseCollection.item);
console.log(`🔗 Total API endpoints: ${totalRequests}`);

// Clean up part files
parts.forEach(partFile => {
  if (fs.existsSync(partFile)) {
    fs.unlinkSync(partFile);
  }
});

console.log('🧹 Cleaned up temporary part files');
console.log('✨ Postman collection is ready for import!');