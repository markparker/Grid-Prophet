"use client"

import { useState } from "react"
import dynamic from "next/dynamic"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Gauge, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

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

export function DashboardTelemetrySection({ races, drivers }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button className="flex w-full items-center justify-between rounded-lg border border-border/30 bg-card/50 px-4 py-3 text-left transition-colors hover:bg-card/80">
          <div className="flex items-center gap-2">
            <Gauge className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Race Telemetry</span>
          </div>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform",
              open && "rotate-180"
            )}
          />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-4">
          <TelemetryDashboard races={races} drivers={drivers} />
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
