"use client"

import { Copy, Check } from "lucide-react"
import { useState } from "react"

export function InviteCodeDisplay({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div>
      <p className="text-sm text-muted-foreground">Invite Code</p>
      <button
        onClick={handleCopy}
        className="mt-1 flex items-center gap-2 rounded-md bg-secondary px-3 py-1.5 font-mono text-sm font-bold tracking-wider transition-colors hover:bg-secondary/80"
        aria-label="Copy invite code"
      >
        {code}
        {copied ? (
          <Check className="h-3.5 w-3.5 text-f1-green" />
        ) : (
          <Copy className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </button>
    </div>
  )
}
