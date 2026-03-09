"use client"

import dynamic from "next/dynamic"

const TelemetryDashboard = dynamic(
  () =>
    import("@/components/telemetry/telemetry-dashboard").then(
      (mod) => mod.TelemetryDashboard
    ),
  { ssr: false }
)

interface Race {
  id: string
  round: number
  race_name: string
  country: string
  race_date: string
  results_fetched: boolean
}

interface Driver {
  id: string
  name: string
  surname: string
  short_name: string
  number: number
  team_name: string
  team_id: string
}

interface Props {
  races: Race[]
  drivers: Driver[]
}

export function TelemetryPageClient({ races, drivers }: Props) {
  return <TelemetryDashboard races={races} drivers={drivers} />
}
