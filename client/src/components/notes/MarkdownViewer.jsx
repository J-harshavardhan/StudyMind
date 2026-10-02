import { useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';
import lightTheme from 'highlight.js/styles/github.css?url';
import darkTheme from 'highlight.js/styles/github-dark.css?url';
import { useTheme } from '../../context/ThemeContext';

function HighlightThemes({ dark }) {
  useEffect(() => {
    const themes = [
      { id: 'studymind-highlight-light', href: lightTheme },
      { id: 'studymind-highlight-dark', href: darkTheme }
    ];
    themes.forEach(({ id, href }) => {
      if (!document.getElementById(id)) {
        const link = document.createElement('link');
        link.id = id;
        link.rel = 'stylesheet';
        link.href = href;
        document.head.appendChild(link);
      }
    });
    const light = document.getElementById('studymind-highlight-light');
    const darkLink = document.getElementById('studymind-highlight-dark');
    if (light && darkLink) {
      light.disabled = dark;
      darkLink.disabled = !dark;
    }
  }, [dark]);

  return null;
}

function CodeBlock({ children, className, inline, ...props }) {
  if (inline) return <code className={className} {...props}>{children}</code>;
  const copy = async () => {
    await navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
  };
  return (
    <div className="markdown-code-block">
      <button className="btn btn-sm btn-outline-secondary markdown-copy-button" onClick={copy}>Copy</button>
      <pre><code className={className} {...props}>{children}</code></pre>
    </div>
  );
}

export default function MarkdownViewer({ content = '' }) {
  const { dark } = useTheme();
  return (
    <div className="markdown-body">
      <HighlightThemes dark={dark} />
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          a: ({ ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" />,
          code: CodeBlock
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
