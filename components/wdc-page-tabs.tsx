"use client"

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { WdcPredictionForm } from "@/components/wdc-prediction-form"
import { Trophy, Gauge } from "lucide-react"
import dynamic from "next/dynamic"

const TelemetryDashboard = dynamic(
  () =>
    import("@/components/telemetry/telemetry-dashboard").then(
      (mod) => mod.TelemetryDashboard
    ),
  { ssr: false }
)

interface Driver {
  id: string
  name: string
  surname: string
  short_name: string
  number: number
  team_name: string
  team_id: string
}

interface Race {
  id: string
  round: number
  race_name: string
  country: string
  race_date: string
  results_fetched: boolean
}

interface Standing {
  driver_id: string
  points: number
  position: number
  source: "live" | "local"
}

interface ExistingPrediction {
  wdc_prediction_positions: Array<{
    driver_id: string
    predicted_position: number
  }>
}

interface Props {
  drivers: Driver[]
  races: Race[]
  existingPrediction: ExistingPrediction | null
  currentStandings: Standing[]
  isLocked: boolean
  hasLiveData: boolean
  lockDate: string
}

export function WdcPageTabs({
  drivers,
  races,
  existingPrediction,
  currentStandings,
  isLocked,
  hasLiveData,
  lockDate,
}: Props) {
  return (
    <Tabs defaultValue="championship">
      <TabsList>
        <TabsTrigger value="championship">
          <Trophy className="h-3.5 w-3.5" />
          Championship
        </TabsTrigger>
        <TabsTrigger value="telemetry">
          <Gauge className="h-3.5 w-3.5" />
          Telemetry
        </TabsTrigger>
      </TabsList>

      <TabsContent value="championship">
        <WdcPredictionForm
          drivers={drivers}
          existingPrediction={existingPrediction}
          currentStandings={currentStandings}
          isLocked={isLocked}
          hasLiveData={hasLiveData}
          lockDate={lockDate}
        />
      </TabsContent>

      <TabsContent value="telemetry" forceMount>
        <TelemetryDashboard races={races} drivers={drivers} />
      </TabsContent>
    </Tabs>
  )
}
