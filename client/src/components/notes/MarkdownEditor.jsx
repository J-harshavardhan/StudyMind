import { useEffect, useRef, useState } from 'react';
import MarkdownViewer from './MarkdownViewer';

const toolbar = [
  ['bold', '**', '**'],
  ['italic', '_', '_'],
  ['heading', '## ', ''],
  ['code block', '```\\n', '\\n```'],
  ['list', '- ', ''],
  ['link', '[', '](https://)']
];

export default function MarkdownEditor({ value, onChange, onSave }) {
  const textareaRef = useRef(null);
  const [preview, setPreview] = useState(false);
  const wordCount = value.trim() ? value.trim().split(/\s+/u).length : 0;

  const insertMarkdown = (before, after) => {
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.slice(start, end) || 'text';
    const nextValue = `${value.slice(0, start)}${before}${selected}${after}${value.slice(end)}`;
    onChange(nextValue);
    requestAnimationFrame(() => {
      textarea.focus();
      const cursor = start + before.length + selected.length + after.length;
      textarea.setSelectionRange(cursor, cursor);
    });
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        onSave?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSave]);

  return (
    <div className="markdown-editor">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <div className="btn-group" role="tablist">
          <button type="button" className={`btn btn-sm ${!preview ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setPreview(false)}>Write</button>
          <button type="button" className={`btn btn-sm ${preview ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setPreview(true)}>Preview</button>
        </div>
        <small className="text-body-secondary">{wordCount} words</small>
      </div>
      {!preview && (
        <div className="btn-toolbar gap-1 mb-2" aria-label="Markdown toolbar">
          {toolbar.map(([label, before, after]) => <button type="button" className="btn btn-sm btn-outline-secondary" key={label} onClick={() => insertMarkdown(before.replace('\\n', '\n'), after.replace('\\n', '\n'))}>{label}</button>)}
        </div>
      )}
      {preview ? <div className="border rounded p-3 markdown-preview"><MarkdownViewer content={value} /></div> : <textarea ref={textareaRef} className="form-control font-monospace" rows="16" value={value} onChange={(event) => onChange(event.target.value)} />}
    </div>
  );
}
