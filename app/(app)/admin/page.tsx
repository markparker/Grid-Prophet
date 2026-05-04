import { createClient } from "@/lib/supabase/server"
import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Users, UserCheck, Clock, Flag } from "lucide-react"
import { ReprocessButton } from "@/components/admin/reprocess-button"

export default async function AdminPage() {
  const session = await getSession()
  if (!session) redirect("/")
  if (!session.isAdmin) redirect("/dashboard")

  const supabase = await createClient()

  // Fetch all users with their leagues and all races
  const [{ data: users }, { data: races }] = await Promise.all([
    supabase
      .from("players")
      .select("id, name, email, group_id, last_login, login_method, created_at, groups(name, invite_code)")
      .order("last_login", { ascending: false, nullsFirst: false }),
    supabase
      .from("races")
      .select("id, round, race_name, country, race_date, results_fetched")
      .order("round", { ascending: true }),
  ])

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

      {/* Race Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5" />
            Race Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Reprocess race results if they changed due to penalties or F1 API updates.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Round</th>
                  <th className="text-left py-3 px-4 font-medium">Race</th>
                  <th className="text-left py-3 px-4 font-medium">Date</th>
                  <th className="text-left py-3 px-4 font-medium">Status</th>
                  <th className="text-left py-3 px-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {races && races.length > 0 ? (
                  races.filter(race => {
                    const raceDate = new Date(race.race_date)
                    const today = new Date()
                    return raceDate <= today
                  }).map((race) => (
                    <tr key={race.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4 font-mono">{race.round}</td>
                      <td className="py-3 px-4">{race.race_name}</td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {new Date(race.race_date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="py-3 px-4">
                        {race.results_fetched ? (
                          <span className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-600">
                            Scored
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-600">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <ReprocessButton raceId={race.id} round={race.round} raceName={race.race_name} />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground">
                      No past races found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

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
                            user.login_method === 'clerk' 
                              ? 'bg-green-500/10 text-green-600' 
                              : user.login_method === 'google'
                              ? 'bg-blue-500/10 text-blue-600' 
                              : 'bg-purple-500/10 text-purple-600'
                          }`}>
                            {user.login_method === 'clerk' ? 'Clerk' : user.login_method === 'google' ? 'Google' : 'Invite'}
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
