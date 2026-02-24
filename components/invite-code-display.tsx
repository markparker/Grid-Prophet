"use client"

import { Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"

export function InviteCodeDisplay({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex items-center gap-2">
      <code className="rounded-md bg-secondary px-3 py-1.5 font-mono text-lg font-bold tracking-[0.3em] text-foreground">
        {code}
      </code>
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCopy} aria-label="Copy invite code">
        {copied ? (
          <Check className="h-4 w-4 text-f1-green" />
        ) : (
          <Copy className="h-4 w-4 text-muted-foreground" />
        )}
      </Button>
    </div>
  )
}
