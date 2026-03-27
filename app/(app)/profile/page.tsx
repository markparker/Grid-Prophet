"use client"

// Profile page v2 - simplified inline implementation
import { useEffect, useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import {
  User,
  Camera,
  Link as LinkIcon,
  Unlink,
  Save,
  Shield,
  Users,
  Mail,
  Loader2,
  Copy,
  Check,
  MessageCircle,
} from "lucide-react"

interface PlayerProfile {
  id: string
  name: string
  email: string | null
  google_id: string | null
  avatar_url: string | null
  group_id: string
  groups: {
    name: string
    invite_code: string
  }
}

// --- Share helpers ---

function shareWhatsApp(code: string, name: string) {
  const text = encodeURIComponent(`Join my F1 prediction league "${name}" on Grid Prophet! Use invite code: ${code}`)
  window.open(`https://wa.me/?text=${text}`, "_blank")
}

function shareTwitter(code: string, name: string) {
  const text = encodeURIComponent(`Join my F1 prediction league "${name}" on Grid Prophet! Use invite code: ${code}`)
  window.open(`https://twitter.com/intent/tweet?text=${text}`, "_blank")
}

function shareEmail(code: string, name: string) {
  const subject = encodeURIComponent(`Join my F1 prediction league: ${name}`)
  const body = encodeURIComponent(`Join my F1 prediction league "${name}" on Grid Prophet!\n\nUse invite code: ${code}`)
  window.open(`mailto:?subject=${subject}&body=${body}`)
}

function shareSMS(code: string, name: string) {
  const body = encodeURIComponent(`Join my F1 prediction league "${name}" on Grid Prophet! Invite code: ${code}`)
  window.open(`sms:?&body=${body}`)
}

// --- Sub-components ---

interface ProfileInfoCardProps {
  profile: PlayerProfile
  displayName: string
  avatarPreview: string
  avatarUrl: string
  saving: boolean
  fileInputRef: React.RefObject<HTMLInputElement>
  onDisplayNameChange: (name: string) => void
  onAvatarUrlChange: (url: string) => void
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void
  onSave: (e: React.FormEvent) => void
}

function ProfileInfoCard({
  profile,
  displayName,
  avatarPreview,
  avatarUrl,
  saving,
  fileInputRef,
  onDisplayNameChange,
  onAvatarUrlChange,
  onFileSelect,
  onSave,
}: ProfileInfoCardProps) {
  const initials = profile.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <User className="h-5 w-5 text-primary" />
          Profile Info
        </CardTitle>
        <CardDescription>
          Update your display name and profile picture.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSave} className="flex flex-col gap-6">
          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="group relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-border transition-colors hover:border-primary"
              aria-label="Change profile picture"
            >
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Profile"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-xl font-bold text-muted-foreground">
                  {initials}
                </span>
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-background/60 opacity-0 transition-opacity group-hover:opacity-100">
                <Camera className="h-5 w-5 text-foreground" />
              </div>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onFileSelect}
            />
            <div className="flex flex-col gap-2">
              <Label htmlFor="avatar-url" className="text-xs text-muted-foreground">
                Or paste an image URL
              </Label>
              <Input
                id="avatar-url"
                value={avatarUrl}
                onChange={(e) => onAvatarUrlChange(e.target.value)}
                placeholder="https://example.com/photo.jpg"
                className="h-8 text-xs"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="display-name">Display Name</Label>
            <Input
              id="display-name"
              value={displayName}
              onChange={(e) => onDisplayNameChange(e.target.value)}
              placeholder="Your name"
              required
            />
          </div>

          <Button type="submit" disabled={saving} className="self-start">
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

interface GoogleAccountCardProps {
  profile: PlayerProfile
  linking: boolean
  onLink: () => void
  onUnlink: () => void
}

function GoogleAccountCard({ profile, linking, onLink, onUnlink }: GoogleAccountCardProps) {
  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Shield className="h-5 w-5 text-primary" />
          Google Account
        </CardTitle>
        <CardDescription>
          Link your Google account to sign in faster next time.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {profile.google_id ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 rounded-lg border border-border bg-secondary/30 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{profile.email || "Google account"}</p>
                <p className="text-xs text-muted-foreground">Linked to your profile</p>
              </div>
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                Connected
              </Badge>
            </div>
            <Button
              variant="outline"
              onClick={onUnlink}
              disabled={linking}
              className="self-start"
            >
              {linking ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Unlink className="mr-2 h-4 w-4" />
              )}
              Unlink Google
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              No Google account linked. Link one to sign back in to any of your
              leagues with a single click.
            </p>
            <Button onClick={onLink} disabled={linking} className="self-start">
              {linking ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <LinkIcon className="mr-2 h-4 w-4" />
              )}
              Link Google Account
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface LeagueInfoCardProps {
  profile: PlayerProfile
}

function LeagueInfoCard({ profile }: LeagueInfoCardProps) {
  const [copiedCode, setCopiedCode] = useState(false)
  const { invite_code, name } = profile.groups

  function copyInviteCode() {
    navigator.clipboard.writeText(invite_code)
    setCopiedCode(true)
    toast.success("Invite code copied!")
    setTimeout(() => setCopiedCode(false), 2500)
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="h-5 w-5 text-primary" />
          League Info
        </CardTitle>
        <CardDescription>
          Your current prediction league details.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground">League</p>
            <p className="text-sm font-medium">{name}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Email</p>
            <p className="text-sm">{profile.email || "Not set"}</p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-muted-foreground">Invite Code</p>
          <button
            onClick={copyInviteCode}
            className="group flex w-full items-center justify-between rounded-lg border border-dashed border-primary/40 bg-primary/5 px-4 py-3 transition-all hover:border-primary hover:bg-primary/10"
          >
            <span className="font-mono text-lg font-bold tracking-[0.25em] text-primary">
              {invite_code}
            </span>
            {copiedCode ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
            )}
          </button>
          <p className="text-xs text-muted-foreground">Click to copy</p>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-muted-foreground">Share with friends</p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 h-9"
              onClick={() => shareWhatsApp(invite_code, name)}
            >
              <svg className="h-4 w-4 text-[#25D366]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              WhatsApp
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 h-9"
              onClick={() => shareTwitter(invite_code, name)}
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              X / Twitter
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 h-9"
              onClick={() => shareEmail(invite_code, name)}
            >
              <Mail className="h-4 w-4 text-muted-foreground" />
              Email
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 h-9"
              onClick={() => shareSMS(invite_code, name)}
            >
              <MessageCircle className="h-4 w-4 text-green-500" />
              Text
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// --- Page ---

export default function ProfilePage() {
  const [profile, setProfile] = useState<PlayerProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [linking, setLinking] = useState(false)

  const [displayName, setDisplayName] = useState("")
  const [avatarPreview, setAvatarPreview] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchProfile()
  }, [])

  // On page load, check if we're returning from a Google link flow
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get("link") === "true") {
      linkAfterOAuthReturn()
    }
  }, [])

  async function fetchProfile() {
    try {
      const res = await fetch("/api/profile")
      const data = await res.json()
      if (res.ok && data.player) {
        setProfile(data.player)
        setDisplayName(data.player.name)
        setAvatarPreview(data.player.avatar_url || "")
        setAvatarUrl(data.player.avatar_url || "")
      }
    } catch {
      toast.error("Failed to load profile")
    } finally {
      setLoading(false)
    }
  }

  async function linkAfterOAuthReturn() {
    setLinking(true)
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "link_google" }),
      })
      const data = await res.json()
      if (res.ok && data.linked) {
        toast.success("Google account linked successfully!")
        fetchProfile()
      } else {
        toast.error(data.error || "Failed to link Google account")
      }
    } catch {
      toast.error("Failed to link Google account")
    } finally {
      setLinking(false)
      window.history.replaceState({}, "", "/profile")
    }
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    if (!displayName.trim()) {
      toast.error("Name cannot be empty")
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: displayName.trim(), avatarUrl }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Failed to save")
        return
      }
      setProfile(data.player)
      toast.success("Profile updated! Refresh the page to see nav changes.")
    } catch {
      toast.error("Failed to save profile")
    } finally {
      setSaving(false)
    }
  }

  function handleAvatarUrlChange(url: string) {
    setAvatarUrl(url)
    setAvatarPreview(url)
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be under 2MB")
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      setAvatarPreview(dataUrl)
      setAvatarUrl(dataUrl)
    }
    reader.readAsDataURL(file)
  }

  async function handleLinkGoogle() {
    setLinking(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/profile&link=true`,
        },
      })
      if (error) {
        toast.error("Failed to start Google sign-in")
        setLinking(false)
      }
    } catch {
      toast.error("Failed to link Google account")
      setLinking(false)
    }
  }

  async function handleUnlinkGoogle() {
    setLinking(true)
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "unlink_google" }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Failed to unlink")
        return
      }
      setProfile(data.player)
      toast.success("Google account unlinked")
    } catch {
      toast.error("Failed to unlink Google account")
    } finally {
      setLinking(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto flex max-w-2xl items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <p className="text-muted-foreground">Could not load your profile.</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
        <p className="text-sm text-muted-foreground">
          Manage your account settings and linked accounts.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        <ProfileInfoCard
          profile={profile}
          displayName={displayName}
          avatarPreview={avatarPreview}
          avatarUrl={avatarUrl}
          saving={saving}
          fileInputRef={fileInputRef}
          onDisplayNameChange={setDisplayName}
          onAvatarUrlChange={handleAvatarUrlChange}
          onFileSelect={handleFileSelect}
          onSave={handleSaveProfile}
        />
        <GoogleAccountCard
          profile={profile}
          linking={linking}
          onLink={handleLinkGoogle}
          onUnlink={handleUnlinkGoogle}
        />
        <LeagueInfoCard profile={profile} />
      </div>
    </div>
  )
}
