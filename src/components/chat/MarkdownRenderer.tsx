import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { cn } from '@/lib/utils';

interface MarkdownRendererProps {
    content: string;
    className?: string;
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
    return (
        <div className={cn("prose dark:prose-invert max-w-none", className)}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw, rehypeSanitize]}
                components={{
                    code({ className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || '');
                        const isCodeBlock = match && String(children).includes('\n');

                        return isCodeBlock ? (
                            <SyntaxHighlighter
                                style={atomDark}
                                language={match[1]}
                                PreTag="div"
                                className="rounded-md my-2"
                                {...props}
                            >
                                {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                        ) : (
                            <code className={cn("bg-muted px-1.5 py-0.5 rounded-md text-sm", className)} {...props}>
                                {children}
                            </code>
                        );
                    },
                    // Customize other markdown elements
                    p({ children }) {
                        return <p className="mb-4 last:mb-0">{children}</p>;
                    },
                    ul({ children }) {
                        return <ul className="list-disc pl-6 mb-4">{children}</ul>;
                    },
                    ol({ children }) {
                        return <ol className="list-decimal pl-6 mb-4">{children}</ol>;
                    },
                    li({ children }) {
                        return <li className="mb-1">{children}</li>;
                    },
                    h1({ children }) {
                        return <h1 className="text-2xl font-bold mt-6 mb-4">{children}</h1>;
                    },
                    h2({ children }) {
                        return <h2 className="text-xl font-bold mt-6 mb-3">{children}</h2>;
                    },
                    h3({ children }) {
                        return <h3 className="text-lg font-bold mt-4 mb-2">{children}</h3>;
                    },
                    a({ children, href }) {
                        return (
                            <a
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary underline hover:text-primary/80 transition-colors"
                            >
                                {children}
                            </a>
                        );
                    },
                    blockquote({ children }) {
                        return (
                            <blockquote className="border-l-4 border-primary/30 pl-4 py-1 italic my-4">
                                {children}
                            </blockquote>
                        );
                    },
                    table({ children }) {
                        return (
                            <div className="overflow-x-auto my-4">
                                <table className="min-w-full divide-y divide-border">
                                    {children}
                                </table>
                            </div>
                        );
                    },
                    th({ children }) {
                        return <th className="px-4 py-2 bg-muted font-medium text-left">{children}</th>;
                    },
                    td({ children }) {
                        return <td className="px-4 py-2 border-t border-border">{children}</td>;
                    },
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
} 