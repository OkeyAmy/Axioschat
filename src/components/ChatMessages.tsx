import type React from "react"
import { cn } from "@/lib/utils"
import { Code } from "lucide-react"

interface ChatMessagesProps {
  messages: { role: string; content: string }[]
}

const ChatMessages: React.FC<ChatMessagesProps> = ({ messages }) => {
  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="bg-primary/10 p-4 rounded-full mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-primary"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        </div>
        <h3 className="text-lg font-medium">Start a conversation</h3>
        <p className="text-muted-foreground mt-2">Select a chat from the sidebar or start a new one.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col space-y-4 p-4 w-full">
      {messages.map((message, index) => (
        <div
          key={index}
          className={cn(
            "flex max-w-[80%] rounded-lg px-4 py-3",
            message.role === "user"
              ? "ml-auto bg-primary text-primary-foreground"
              : message.role === "function"
                ? "bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800"
                : "bg-muted",
          )}
        >
          {message.role === "function" && (
            <div className="flex items-center mr-2">
              <Code size={16} className="text-amber-600 dark:text-amber-400" />
            </div>
          )}
          <div className="whitespace-pre-wrap break-words">
            {message.role === "function" ? (
              <div>
                <div className="font-mono text-xs text-amber-700 dark:text-amber-300 mb-1">Function Response:</div>
                <pre className="text-xs overflow-auto">{message.content}</pre>
              </div>
            ) : (
              <p>{message.content}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

export default ChatMessages
