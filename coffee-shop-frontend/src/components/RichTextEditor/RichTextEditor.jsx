import { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import './RichTextEditor.css';

export default function RichTextEditor({ value, onChange }) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose-base focus:outline-none min-h-[400px] w-full max-w-none p-4',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Sync value from outside (e.g., when AI generates new content)
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="tiptap-editor-container border border-border rounded-lg bg-background flex flex-col">
      {/* Basic Toolbar */}
      <div className="flex flex-wrap gap-2 p-2 border-b border-border bg-muted/50 rounded-t-lg">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`px-2 py-1 text-sm rounded border ${
            editor.isActive('bold') ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'
          }`}
        >
          Bold
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`px-2 py-1 text-sm rounded border ${
            editor.isActive('italic') ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'
          }`}
        >
          Italic
        </button>
        <span className="w-px h-6 bg-border mx-1 self-center"></span>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`px-2 py-1 text-sm rounded border ${
            editor.isActive('heading', { level: 2 }) ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'
          }`}
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`px-2 py-1 text-sm rounded border ${
            editor.isActive('heading', { level: 3 }) ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'
          }`}
        >
          H3
        </button>
        <span className="w-px h-6 bg-border mx-1 self-center"></span>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`px-2 py-1 text-sm rounded border ${
            editor.isActive('bulletList') ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'
          }`}
        >
          Bullet List
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`px-2 py-1 text-sm rounded border ${
            editor.isActive('orderedList') ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'
          }`}
        >
          Numbered List
        </button>
      </div>
      
      {/* Editor Content */}
      <div className="overflow-y-auto w-full flex-grow">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
