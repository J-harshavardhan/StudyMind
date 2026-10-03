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
    const selected = value.slice(start, end);
    const nextValue = `${value.slice(0, start)}${before}${selected}${after}${value.slice(end)}`;
    onChange(nextValue);
    requestAnimationFrame(() => {
      textarea.focus();
      const selectionStart = start + before.length;
      const selectionEnd = selectionStart + selected.length;
      textarea.setSelectionRange(
        selected ? selectionEnd + after.length : selectionStart,
        selected ? selectionEnd + after.length : selectionStart
      );
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
    <div className="markdown-editor" aria-label="Note editor">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <div className="editor-tabs" role="tablist" aria-label="Editor mode">
          <button type="button" role="tab" aria-selected={!preview} className={`editor-tab ${!preview ? 'is-active' : ''}`} onClick={() => setPreview(false)}>Write</button>
          <button type="button" role="tab" aria-selected={preview} className={`editor-tab ${preview ? 'is-active' : ''}`} onClick={() => setPreview(true)}>Preview</button>
        </div>
        <small className="text-body-secondary">{wordCount} words</small>
      </div>
      {!preview && (
        <div className="btn-toolbar gap-1 mb-2" aria-label="Markdown toolbar">
          {toolbar.map(([label, before, after]) => <button type="button" className="editor-tool" key={label} onClick={() => insertMarkdown(before.replace('\\n', '\n'), after.replace('\\n', '\n'))}>{label}</button>)}
        </div>
      )}
      {preview ? <div className="markdown-preview"><MarkdownViewer content={value} /></div> : <textarea ref={textareaRef} aria-label="Note content" className="form-control font-monospace markdown-input" rows="16" value={value} onChange={(event) => onChange(event.target.value)} />}
    </div>
  );
}
