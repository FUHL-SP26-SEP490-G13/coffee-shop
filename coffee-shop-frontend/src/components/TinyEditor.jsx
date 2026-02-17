import { Editor } from "@tinymce/tinymce-react";

export default function TinyEditor({ value, onChange }) {
  return (
    <Editor
      apiKey="tscb7hb2ifw1rdl0tmv9co38d0phbkc5640sw9jusssy74bp"
      value={value}
      onEditorChange={onChange}
      init={{
        height: 500,
        menubar: true,

        plugins: [
          "advlist",
          "autolink",
          "lists",
          "link",
          "image",
          "charmap",
          "preview",
          "searchreplace",
          "visualblocks",
          "code",
          "fullscreen",
          "insertdatetime",
          "media",
          "table",
          "help",
          "wordcount",
        ],

        toolbar:
          "undo redo | blocks | bold italic | alignleft aligncenter alignright | bullist numlist | image media | code fullscreen",

        branding: false,        // bỏ logo TinyMCE
        statusbar: false,       // bỏ thanh dưới cùng
        resize: false,          // bỏ resize nếu muốn
        elementpath: false,     // bỏ p > li > strong
      }}
    />
  );
}
