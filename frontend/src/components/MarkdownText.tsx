import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

type Props = { text: string | null | undefined; className?: string }

/**
 * Safely render user-authored Markdown. Raw HTML is intentionally disabled.
 * CSS preserves repeated spaces, tabs, and single newlines in normal paragraphs.
 */
export default function MarkdownText({ text, className = '' }: Props) {
  if (!text) return null
  return (
    <div className={`lms-markdown ${className}`.trim()}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml
        components={{ img: () => null }}
        urlTransform={(url) => {
          // Do not allow javascript:, data:, file:, etc. in author-supplied links.
          // Relative links and fragment links remain usable.
          const trimmed = url.trim()
          return /^(https?:|mailto:|\/|#|\.\/|\.\.\/)/i.test(trimmed) ? trimmed : ''
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  )
}
