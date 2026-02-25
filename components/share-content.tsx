"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Copy,
  Check,
  MessageCircle,
  Mail,
  ArrowRight,
  Share2,
} from "lucide-react"
import { toast } from "sonner"

function TwitterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  )
}

export function ShareContent() {
  const searchParams = useSearchParams()
  const inviteCode = searchParams.get("code") || ""
  const leagueName = searchParams.get("name") || "your league"
  const [copied, setCopied] = useState(false)
  const [mounted, setMounted] = useState(false)

  const shareMessage = `Join my F1 prediction league "${leagueName}" on Grid Prophet! Use invite code: ${inviteCode}`
  const shareUrl = mounted ? window.location.origin : ""

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && !inviteCode) {
      window.location.href = "/dashboard"
    }
  }, [mounted, inviteCode])

  function copyCode() {
    navigator.clipboard.writeText(inviteCode)
    setCopied(true)
    toast.success("Invite code copied!")
    setTimeout(() => setCopied(false), 2500)
  }

  function copyMessage() {
    navigator.clipboard.writeText(`${shareMessage}\n${shareUrl}`)
    toast.success("Share message copied!")
  }

  function shareTwitter() {
    const text = encodeURIComponent(`${shareMessage}\n${shareUrl}`)
    window.open(`https://twitter.com/intent/tweet?text=${text}`, "_blank")
  }

  function shareWhatsApp() {
    const text = encodeURIComponent(`${shareMessage}\n${shareUrl}`)
    window.open(`https://wa.me/?text=${text}`, "_blank")
  }

  function shareFacebook() {
    const url = encodeURIComponent(shareUrl)
    const quote = encodeURIComponent(shareMessage)
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${quote}`,
      "_blank"
    )
  }

  function shareEmail() {
    const subject = encodeURIComponent(
      `Join my F1 prediction league: ${leagueName}`
    )
    const body = encodeURIComponent(
      `${shareMessage}\n\nJoin here: ${shareUrl}`
    )
    window.open(`mailto:?subject=${subject}&body=${body}`)
  }

  function shareSMS() {
    const body = encodeURIComponent(`${shareMessage}\n${shareUrl}`)
    window.open(`sms:?&body=${body}`)
  }

  async function shareNative() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${leagueName} on Grid Prophet`,
          text: shareMessage,
          url: shareUrl,
        })
      } catch {
        // User cancelled
      }
    } else {
      copyMessage()
    }
  }

  if (!mounted || !inviteCode) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center px-4">
      <div className="w-full max-w-md flex flex-col gap-6">
        {/* Header */}
        <div className="text-center flex flex-col gap-2">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-f1-green/30 bg-f1-green/10 px-4 py-1.5">
            <span className="text-xs font-mono font-medium tracking-wider text-f1-green">
              LEAGUE CREATED
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-balance">
            Invite your friends to {leagueName}
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Share the invite code below so your friends can join and start
            predicting.
          </p>
        </div>

        {/* Invite Code Card */}
        <Card className="border-primary/20 bg-card">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Invite Code
              </p>
              <button
                onClick={copyCode}
                className="group relative flex items-center gap-3 rounded-lg border-2 border-dashed border-primary/40 bg-primary/5 px-8 py-4 transition-all hover:border-primary hover:bg-primary/10"
              >
                <span className="font-mono text-3xl font-bold tracking-[0.3em] text-primary">
                  {inviteCode}
                </span>
                {copied ? (
                  <Check className="h-5 w-5 text-f1-green" />
                ) : (
                  <Copy className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-primary" />
                )}
              </button>
              <p className="text-xs text-muted-foreground">Click to copy</p>
            </div>
          </CardContent>
        </Card>

        {/* Share Options */}
        <Card className="bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Share via</CardTitle>
            <CardDescription>
              Send the invite to your friends through any app.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-12 gap-3 justify-start"
                onClick={shareWhatsApp}
              >
                <WhatsAppIcon className="h-5 w-5 text-[#25D366]" />
                <span>WhatsApp</span>
              </Button>
              <Button
                variant="outline"
                className="h-12 gap-3 justify-start"
                onClick={shareTwitter}
              >
                <TwitterIcon className="h-4 w-4" />
                <span>X / Twitter</span>
              </Button>
              <Button
                variant="outline"
                className="h-12 gap-3 justify-start"
                onClick={shareFacebook}
              >
                <FacebookIcon className="h-5 w-5 text-[#1877F2]" />
                <span>Facebook</span>
              </Button>
              <Button
                variant="outline"
                className="h-12 gap-3 justify-start"
                onClick={shareEmail}
              >
                <Mail className="h-5 w-5 text-muted-foreground" />
                <span>Email</span>
              </Button>
            </div>

            <Button
              variant="outline"
              className="h-12 gap-3 justify-start w-full"
              onClick={shareSMS}
            >
              <MessageCircle className="h-5 w-5 text-f1-green" />
              <span>Text Message</span>
            </Button>

            <Button
              variant="secondary"
              className="h-12 gap-3 w-full"
              onClick={shareNative}
            >
              <Share2 className="h-5 w-5" />
              <span>
                {mounted && "share" in navigator
                  ? "More sharing options..."
                  : "Copy share message"}
              </span>
            </Button>
          </CardContent>
        </Card>

        {/* Continue to dashboard */}
        <Button asChild size="lg" className="w-full gap-2">
          <Link href="/dashboard">
            Go to Dashboard
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  )
}
