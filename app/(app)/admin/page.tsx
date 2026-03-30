import { createClient } from "@/lib/supabase/server"
import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Users, UserCheck, Clock } from "lucide-react"

export default async function AdminPage() {
  const session = await getSession()
  if (!session) redirect("/")
  if (!session.isAdmin) redirect("/dashboard")

  const supabase = await createClient()

  // Fetch all users with their leagues
  const { data: users, error: usersError } = await supabase
    .from("players")
    .select("id, name, email, group_id, last_login, login_method, created_at, groups(name, invite_code)")
    .order("last_login", { ascending: false, nullsFirst: false })

  const stats = {
    totalPlayers: users?.length || 0,
    activeToday: users?.filter(u => {
      const lastLogin = u.last_login ? new Date(u.last_login) : null
      if (!lastLogin) return false
      const today = new Date()
      return lastLogin.toDateString() === today.toDateString()
    }).length || 0,
    totalLeagues: new Set(users?.map(u => u.group_id)).size || 0,
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Console</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Platform overview and user management
          </p>
        </div>
        <Link href="/dashboard">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Players
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">{stats.totalPlayers}</span>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">{stats.activeToday}</span>
              <UserCheck className="h-4 w-4 text-f1-green" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Leagues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">{stats.totalLeagues}</span>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Name</th>
                  <th className="text-left py-3 px-4 font-medium">Email</th>
                  <th className="text-left py-3 px-4 font-medium">League</th>
                  <th className="text-left py-3 px-4 font-medium">Last Login</th>
                  <th className="text-left py-3 px-4 font-medium">Method</th>
                  <th className="text-left py-3 px-4 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody>
                {users && users.length > 0 ? (
                  users.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">{user.name}</td>
                      <td className="py-3 px-4 text-muted-foreground">{user.email || "—"}</td>
                      <td className="py-3 px-4">
                        {user.groups && typeof user.groups === 'object' && 'name' in user.groups ? (
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {(user.groups as { name: string }).name}
                          </code>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {user.last_login ? (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {new Date(user.last_login).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs italic">
                            Not tracked yet
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {user.login_method ? (
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                            user.login_method === 'google' 
                              ? 'bg-blue-500/10 text-blue-600' 
                              : 'bg-purple-500/10 text-purple-600'
                          }`}>
                            {user.login_method === 'google' ? 'Google' : 'Invite'}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "2-digit",
                        })}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground">
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
