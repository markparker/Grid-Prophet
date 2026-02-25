import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import { Nav } from "@/components/nav"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()
  if (!session) {
    redirect("/")
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Nav playerName={session.playerName} groupName={session.groupName} avatarUrl={session.avatarUrl} />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">
        {children}
      </main>
    </div>
  )
}
