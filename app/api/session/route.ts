import { NextResponse } from "next/server"
import { getSession, clearSession } from "@/lib/session"

export async function GET() {
  const session = await getSession()
  return NextResponse.json({ session })
}

export async function DELETE() {
  await clearSession()
  return NextResponse.json({ success: true })
}
