import React from 'react';

const EditorToolbar = ({ editor, showAdvanced = false }) => {
  if (!editor) return null;

  const ToolbarButton = ({ onClick, isActive, disabled, title, children }) => (
    <button
      type="button"
      className={`btn btn-outline-secondary btn-sm ${isActive ? 'active' : ''}`}
      onClick={onClick}
      disabled={disabled}
      title={title}
    >
      {children}
    </button>
  );

  const addTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  const addCodeBlock = () => {
    editor.chain().focus().toggleCodeBlock().run();
  };

  const addBlockquote = () => {
    editor.chain().focus().toggleBlockquote().run();
  };

  const addHorizontalRule = () => {
    editor.chain().focus().setHorizontalRule().run();
  };

  return (
    <div className="editor-toolbar d-flex flex-wrap gap-1 p-2 bg-light border-bottom">
      {/* Basic Formatting */}
      <div className="btn-group btn-group-sm me-2">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          title="Bold (Ctrl+B)"
        >
          <strong>B</strong>
        </ToolbarButton>
        
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          title="Italic (Ctrl+I)"
        >
          <em>I</em>
        </ToolbarButton>
        
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive('underline')}
          title="Underline (Ctrl+U)"
        >
          <u>U</u>
        </ToolbarButton>
        
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive('strike')}
          title="Strikethrough"
        >
          <s>S</s>
        </ToolbarButton>
      </div>

      {/* Headings */}
      <div className="btn-group btn-group-sm me-2">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          isActive={editor.isActive('heading', { level: 1 })}
          title="Heading 1"
        >
          H1
        </ToolbarButton>
        
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive('heading', { level: 2 })}
          title="Heading 2"
        >
          H2
        </ToolbarButton>
        
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          isActive={editor.isActive('heading', { level: 3 })}
          title="Heading 3"
        >
          H3
        </ToolbarButton>
      </div>

      {/* Lists */}
      <div className="btn-group btn-group-sm me-2">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          title="Bullet List"
        >
          •
        </ToolbarButton>
        
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          title="Numbered List"
        >
          1.
        </ToolbarButton>
      </div>

      {/* Alignment */}
      <div className="btn-group btn-group-sm me-2">
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          isActive={editor.isActive({ textAlign: 'left' })}
          title="Align Left"
        >
          ⬅
        </ToolbarButton>
        
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          isActive={editor.isActive({ textAlign: 'center' })}
          title="Align Center"
        >
          ↔
        </ToolbarButton>
        
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          isActive={editor.isActive({ textAlign: 'right' })}
          title="Align Right"
        >
          ➡
        </ToolbarButton>
      </div>

      {/* Advanced Features */}
      {showAdvanced && (
        <>
          <div className="btn-group btn-group-sm me-2">
            <ToolbarButton
              onClick={addBlockquote}
              isActive={editor.isActive('blockquote')}
              title="Quote"
            >
              "
            </ToolbarButton>
            
            <ToolbarButton
              onClick={addCodeBlock}
              isActive={editor.isActive('codeBlock')}
              title="Code Block"
            >
              {'</>'}
            </ToolbarButton>
            
            <ToolbarButton
              onClick={addHorizontalRule}
              title="Horizontal Rule"
            >
              ―
            </ToolbarButton>
          </div>

          {editor.can().insertTable && (
            <div className="btn-group btn-group-sm me-2">
              <ToolbarButton
                onClick={addTable}
                title="Insert Table"
              >
                ⊞
              </ToolbarButton>
            </div>
          )}
        </>
      )}

      {/* Undo/Redo */}
      <div className="btn-group btn-group-sm ms-auto">
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Undo (Ctrl+Z)"
        >
          ↶
        </ToolbarButton>
        
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Redo (Ctrl+Y)"
        >
          ↷
        </ToolbarButton>
      </div>
    </div>
  );
};

export default EditorToolbar;