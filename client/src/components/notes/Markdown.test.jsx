import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import MarkdownEditor from './MarkdownEditor';
import MarkdownViewer from './MarkdownViewer';
import { ThemeProvider } from '../../context/ThemeContext';

const renderWithTheme = (element) => render(<ThemeProvider>{element}</ThemeProvider>);

describe('Markdown components', () => {
  it('renders a highlighted code block', () => {
    const { container } = renderWithTheme(<MarkdownViewer content={'```js\nconst answer = 42;\n```'} />);
    expect(container.querySelector('pre code')).toBeInTheDocument();
    expect(container.querySelector('.hljs')).toBeInTheDocument();
  });

  it('does not render raw script tags', () => {
    const { container } = renderWithTheme(<MarkdownViewer content={'<script>alert(1)</script>'} />);
    expect(container.querySelector('script')).not.toBeInTheDocument();
  });

  it('inserts empty bold markers without placeholder text', () => {
    const onChange = vi.fn();
    render(<MarkdownEditor value="hello" onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'bold' }));
    expect(onChange).toHaveBeenCalledWith('****hello');
  });
});
