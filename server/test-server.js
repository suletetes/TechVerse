// Minimal server test to identify import issues
import express from 'express';

console.log('Starting minimal server test...');

try {
  const app = express();
  console.log('Express imported successfully');
  
  app.get('/', (req, res) => {
    res.json({ message: 'Test server running' });
  });
  
  const PORT = 3001;
  app.listen(PORT, () => {
    console.log(`Test server running on port ${PORT}`);
  });
  
} catch (error) {
  console.error('Error starting test server:', error);
}