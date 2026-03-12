import React from 'react';
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
    return (
        <div className="editor-container">
            <CKEditor
                editor={ClassicEditor}
                data={value}
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
