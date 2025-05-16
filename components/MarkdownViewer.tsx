import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface MarkdownViewerProps {
  content: string
}

export function MarkdownViewer({ content }: MarkdownViewerProps) {
  return (
    <div className="bg-purple-50 dark:bg-purple-900/30 p-4 rounded-md overflow-y-auto h-96 select-none text-gray-800 dark:text-gray-100">
      <ReactMarkdown remarkPlugins={[remarkGfm]} >
        {content}
      </ReactMarkdown>
    </div>
  )
}
