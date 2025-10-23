import React, { useState } from 'react';
import { RichTextEditor, ProductDescriptionEditor } from './index';

const EditorDemo = () => {
  const [basicContent, setBasicContent] = useState('');
  const [productContent, setProductContent] = useState(`
    <h2>Premium Wireless Headphones</h2>
    <p>Experience <strong>crystal-clear audio</strong> with our latest wireless headphones featuring:</p>
    <ul>
      <li>Active noise cancellation technology</li>
      <li>30-hour battery life</li>
      <li>Premium leather comfort padding</li>
      <li>Bluetooth 5.0 connectivity</li>
    </ul>
    <p><em>Perfect for music lovers, professionals, and travelers.</em></p>
  `);
  const [isLoading, setIsLoading] = useState(false);

  const handleProductSave = (content) => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      console.log('Saved product description:', content);
      setIsLoading(false);
      alert('Product description saved successfully!');
    }, 1500);
  };

  return (
    <div className="container-fluid py-4">
      <div className="row mb-4">
        <div className="col-12">
          <h2>Rich Text Editor Demo</h2>
          <p className="text-muted">
            Showcasing TipTap rich text editing capabilities with image insertion, 
            formatting options, and specialized product description editing.
          </p>
        </div>
      </div>

      {/* Basic Editor */}
      <div className="row mb-5">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Basic Rich Text Editor</h5>
            </div>
            <div className="card-body">
              <RichTextEditor
                content={basicContent}
                onChange={setBasicContent}
                placeholder="Start typing your content here..."
                minHeight="250px"
              />
              
              <div className="mt-3">
                <h6>Output HTML:</h6>
                <pre className="bg-light p-3 rounded">
                  <code>{basicContent || 'No content yet...'}</code>
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Description Editor */}
      <div className="row mb-5">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Product Description Editor</h5>
            </div>
            <div className="card-body">
              <ProductDescriptionEditor
                initialContent={productContent}
                onSave={handleProductSave}
                isLoading={isLoading}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Features Overview */}
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Editor Features</h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <h6>Text Formatting</h6>
                  <ul className="list-unstyled">
                    <li>✅ Bold, Italic, Underline, Strikethrough</li>
                    <li>✅ Headings (H1, H2, H3)</li>
                    <li>✅ Text alignment (Left, Center, Right)</li>
                    <li>✅ Text colors and styles</li>
                    <li>✅ Bullet and numbered lists</li>
                    <li>✅ Blockquotes and code blocks</li>
                  </ul>
                </div>
                <div className="col-md-6">
                  <h6>Media & Links</h6>
                  <ul className="list-unstyled">
                    <li>✅ Image insertion with URL or upload</li>
                    <li>✅ Link creation and editing</li>
                    <li>✅ Image resizing and positioning</li>
                    <li>✅ Alt text and accessibility support</li>
                    <li>✅ Drag and drop image upload</li>
                    <li>✅ Image preview and validation</li>
                  </ul>
                </div>
              </div>
              
              <div className="row mt-3">
                <div className="col-md-6">
                  <h6>User Experience</h6>
                  <ul className="list-unstyled">
                    <li>✅ Keyboard shortcuts (Ctrl+B, Ctrl+I, etc.)</li>
                    <li>✅ Undo/Redo functionality</li>
                    <li>✅ Auto-save capabilities</li>
                    <li>✅ Character count display</li>
                    <li>✅ Responsive design</li>
                    <li>✅ Mobile-friendly toolbar</li>
                  </ul>
                </div>
                <div className="col-md-6">
                  <h6>Integration Features</h6>
                  <ul className="list-unstyled">
                    <li>✅ React Hook Form compatibility</li>
                    <li>✅ Controlled and uncontrolled modes</li>
                    <li>✅ Custom toolbar configuration</li>
                    <li>✅ HTML output sanitization</li>
                    <li>✅ Custom styling support</li>
                    <li>✅ Event handling and callbacks</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Usage Examples */}
      <div className="row mt-4">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Usage Examples</h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <h6>Basic Usage</h6>
                  <pre className="bg-light p-3 rounded">
                    <code>{`<RichTextEditor
  content={content}
  onChange={setContent}
  placeholder="Start writing..."
  minHeight="200px"
/>`}</code>
                  </pre>
                </div>
                <div className="col-md-6">
                  <h6>Product Description</h6>
                  <pre className="bg-light p-3 rounded">
                    <code>{`<ProductDescriptionEditor
  initialContent={description}
  onSave={handleSave}
  isLoading={saving}
/>`}</code>
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditorDemo;