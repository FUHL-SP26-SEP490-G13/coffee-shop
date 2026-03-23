import { useRef } from 'react';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import './RichTextEditor.css';

/**
 * RichTextEditor component using CKEditor.
 *
 * This component renders a CKEditor instance with a classic editor build.
 * It accepts initial content and a callback to handle content changes.
 *
 * @param {Object} props - Component props.
 * @param {string} props.value - The initial content to load into the editor.
 * @param {function} props.onChange - Callback function to handle content updates.
 */
export default function RichTextEditor({ value, onChange }) {
    const editorRef = useRef(null);

    const handleReady = (editor) => {
        editorRef.current = editor;

        const editableElement = editor.ui?.view?.editable?.element;
        if (!editableElement) return;

        // Keep clipboard shortcuts/events inside the editor when used in modal dialogs.
        editableElement.addEventListener('paste', (event) => {
            event.stopPropagation();
        });

        editableElement.addEventListener('keydown', (event) => {
            const isPasteShortcut = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'v';
            if (isPasteShortcut) {
                event.stopPropagation();
            }
        });
    };

    return (
        <div className="editor-container">
            <CKEditor
                editor={ClassicEditor}
                data={value}
                onReady={handleReady}
                onChange={(event, editor) => {
                    // Get the data from the editor
                    const data = editor.getData();
                    // Trigger the onChange callback with the updated data
                    onChange(data);
                }}
            />
        </div>
    );
}
