"use client"

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
        body: JSON.stringify({
          name: displayName.trim(),
          avatarUrl: avatarUrl,
        }),
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

  function handleAvatarUrlInput(url: string) {
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

  // On page load, check if we're returning from a Google link flow
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get("link") === "true") {
      // Call the link API after returning from Google OAuth
      async function linkAfterReturn() {
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
        }
        // Clean up URL
        window.history.replaceState({}, "", "/profile")
      }
      linkAfterReturn()
    }
  }, [])

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

  const initials = profile.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
        <p className="text-sm text-muted-foreground">
          Manage your account settings and linked accounts.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {/* Avatar + Name card */}
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
            <form onSubmit={handleSaveProfile} className="flex flex-col gap-6">
              {/* Avatar */}
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
                  onChange={handleFileSelect}
                />
                <div className="flex flex-col gap-2">
                  <Label htmlFor="avatar-url" className="text-xs text-muted-foreground">
                    Or paste an image URL
                  </Label>
                  <Input
                    id="avatar-url"
                    value={avatarUrl}
                    onChange={(e) => handleAvatarUrlInput(e.target.value)}
                    placeholder="https://example.com/photo.jpg"
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              {/* Display name */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="display-name">Display Name</Label>
                <Input
                  id="display-name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
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

        {/* Google Link card */}
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
                  onClick={handleUnlinkGoogle}
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
                <Button
                  onClick={handleLinkGoogle}
                  disabled={linking}
                  className="self-start"
                >
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

        {/* Group Info card */}
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
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground">League</p>
                <p className="text-sm font-medium">{profile.groups.name}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Invite Code</p>
                <p className="font-mono text-sm font-bold tracking-widest text-primary">
                  {profile.groups.invite_code}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Player ID</p>
                <p className="font-mono text-xs text-muted-foreground">{profile.id}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Email</p>
                <p className="text-sm">{profile.email || "Not set"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
