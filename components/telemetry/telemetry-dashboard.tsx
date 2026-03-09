"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DriverBadge, TEAM_META } from "@/components/driver-badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useTelemetrySessions, useLaps, useStints, usePositions, useCarStats } from "@/hooks/use-telemetry"
import { SectorTimesPanel } from "@/components/telemetry/sector-times-panel"
import { TireStrategyPanel } from "@/components/telemetry/tire-strategy-panel"
import { PositionPanel } from "@/components/telemetry/position-panel"
import { CarStatsReadout } from "@/components/telemetry/car-stats-readout"
import { SpeedTrapPanel } from "@/components/telemetry/speed-trap-panel"
import { Radio, Gauge } from "lucide-react"
import { cn } from "@/lib/utils"

interface Race {
  id: string
  round: number
  race_name: string
  country: string
  city?: string
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

export function TelemetryDashboard({ races, drivers }: Props) {
  const { sessions, isLoading: sessionsLoading } = useTelemetrySessions()

  // Only show completed races (past race_date)
  const completedRaces = useMemo(() => {
    const now = new Date()
    return races
      .filter((r) => new Date(r.race_date) < now)
      .sort((a, b) => b.round - a.round) // latest first
  }, [races])

  // Default to latest completed race
  const [selectedRound, setSelectedRound] = useState<number | null>(
    completedRaces[0]?.round ?? null
  )

  const [selectedDriverNumber, setSelectedDriverNumber] = useState<number | null>(null)
  const [selectedDriverNumber2, setSelectedDriverNumber2] = useState<number | null>(null)

  const selectedRace = completedRaces.find((r) => r.round === selectedRound) ?? null

  // Map local race round → OpenF1 session_key by matching country name
  const sessionKey = useMemo(() => {
    if (!selectedRace || sessions.length === 0) return null
    const raceCountry = selectedRace.country.toLowerCase().trim()
    
    // Try exact match first
    let match = sessions.find(
      (s) => s.country_name.toLowerCase().trim() === raceCountry
    )
    
    // Try partial match (e.g. "Australia" matches "Australian")
    if (!match) {
      match = sessions.find(
        (s) => s.country_name.toLowerCase().includes(raceCountry) ||
               raceCountry.includes(s.country_name.toLowerCase())
      )
    }
    
    // Try matching by circuit/location name
    const raceCity = selectedRace.city?.toLowerCase().trim()
    if (!match && raceCity) {
      match = sessions.find(
        (s) => s.location?.toLowerCase().includes(raceCity) ||
               s.circuit_short_name?.toLowerCase().includes(raceCity)
      )
    }
    
    return match?.session_key ?? null
  }, [selectedRace, sessions])

  // Get drivers that participated (if results exist) or all drivers
  const availableDrivers = useMemo(() => {
    return drivers.sort((a, b) => a.surname.localeCompare(b.surname))
  }, [drivers])

  // Driver 1
  const selectedDriver = availableDrivers.find((d) => d.number === selectedDriverNumber) ?? null
  const teamColor = selectedDriver ? (TEAM_META[selectedDriver.team_id]?.color ?? "#888888") : "#888888"
  const driverLabel = selectedDriver?.short_name ?? undefined

  // Driver 2
  const selectedDriver2 = availableDrivers.find((d) => d.number === selectedDriverNumber2) ?? null
  const teamColor2 = selectedDriver2 ? (TEAM_META[selectedDriver2.team_id]?.color ?? "#888888") : "#888888"
  const driverLabel2 = selectedDriver2?.short_name ?? undefined

  // Drivers available for the second dropdown (exclude Driver 1)
  const driver2Options = useMemo(
    () => availableDrivers.filter((d) => d.number !== selectedDriverNumber),
    [availableDrivers, selectedDriverNumber]
  )

  // --- SWR hooks for Driver 1 ---
  const { laps, isLoading: lapsLoading, error: lapsError } = useLaps(sessionKey, selectedDriverNumber)
  const { stints, isLoading: stintsLoading, error: stintsError } = useStints(sessionKey, selectedDriverNumber)
  const { positions, intervals, isLoading: positionsLoading, error: positionsError } = usePositions(sessionKey, selectedDriverNumber)
  const { stats, isLoading: statsLoading, error: statsError } = useCarStats(sessionKey, selectedDriverNumber)

  // --- SWR hooks for Driver 2 ---
  const { laps: laps2 } = useLaps(sessionKey, selectedDriverNumber2)
  const { stints: stints2 } = useStints(sessionKey, selectedDriverNumber2)
  const { positions: positions2, intervals: intervals2 } = usePositions(sessionKey, selectedDriverNumber2)
  const { stats: stats2 } = useCarStats(sessionKey, selectedDriverNumber2)

  // Pit stops computed from stints
  const pitStops = stints.length > 0 ? stints.length - 1 : 0
  const pitStops2 = stints2.length > 0 ? stints2.length - 1 : 0

  const isComparing = selectedDriverNumber2 !== null

  return (
    <div className="flex flex-col gap-4">
      {/* Selectors row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
        {/* Race selector */}
        <Select
          value={selectedRound?.toString() ?? ""}
          onValueChange={(v) => {
            setSelectedRound(Number(v))
            setSelectedDriverNumber(null)
            setSelectedDriverNumber2(null)
          }}
        >
          <SelectTrigger className="w-full sm:w-[240px] border-border/50 bg-secondary/30">
            <SelectValue placeholder="Select race" />
          </SelectTrigger>
          <SelectContent>
            {completedRaces.map((race) => (
              <SelectItem key={race.round} value={race.round.toString()}>
                R{race.round} — {race.race_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Driver 1 selector */}
        <Select
          value={selectedDriverNumber?.toString() ?? ""}
          onValueChange={(v) => {
            setSelectedDriverNumber(Number(v))
            setSelectedDriverNumber2(null) // reset driver 2 when driver 1 changes
          }}
          disabled={!selectedRound}
        >
          <SelectTrigger className="w-full sm:w-[250px] border-border/50 bg-secondary/30">
            <SelectValue placeholder="Select driver" />
          </SelectTrigger>
          <SelectContent>
            {availableDrivers.map((driver) => (
              <SelectItem key={driver.id} value={driver.number.toString()}>
                <DriverBadge
                  teamId={driver.team_id}
                  shortName={driver.short_name}
                  firstName={driver.name}
                  lastName={driver.surname}
                  compact
                />
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Driver 2 selector (compare) */}
        <Select
          value={selectedDriverNumber2?.toString() ?? ""}
          onValueChange={(v) => {
            if (v === "__clear__") {
              setSelectedDriverNumber2(null)
            } else {
              setSelectedDriverNumber2(Number(v))
            }
          }}
          disabled={!selectedDriverNumber}
        >
          <SelectTrigger className={cn(
            "w-full sm:w-[250px] border-border/50 bg-secondary/30",
            !selectedDriverNumber && "opacity-50"
          )}>
            <SelectValue placeholder="Compare with..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__clear__">
              <span className="text-xs text-muted-foreground">No comparison</span>
            </SelectItem>
            {driver2Options.map((driver) => (
              <SelectItem key={driver.id} value={driver.number.toString()}>
                <DriverBadge
                  teamId={driver.team_id}
                  shortName={driver.short_name}
                  firstName={driver.name}
                  lastName={driver.surname}
                  compact
                />
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Session key status */}
        {sessionsLoading && selectedRound && (
          <span className="text-xs text-muted-foreground">Loading session data...</span>
        )}
        {selectedRound && !sessionsLoading && !sessionKey && (
          <span className="text-xs text-muted-foreground/60">
            Telemetry data not yet available for this race.
          </span>
        )}
      </div>

      {/* Prompt state when no driver selected */}
      {!selectedDriverNumber && selectedRound && (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <Radio className="h-8 w-8 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">
            Select a driver to view telemetry data. Optionally select a second driver for comparison.
          </p>
        </div>
      )}

      {/* Data panels */}
      {selectedDriverNumber && sessionKey && (
        <div className="flex flex-col gap-4">
          {/* Car Stats Readout — full width */}
          <CarStatsReadout
            stats={stats}
            isLoading={statsLoading}
            error={statsError}
            teamColor={teamColor}
            pitStops={pitStops}
            stats2={isComparing ? stats2 : undefined}
            teamColor2={isComparing ? teamColor2 : undefined}
            pitStops2={isComparing ? pitStops2 : undefined}
            driverLabel={isComparing ? driverLabel : undefined}
            driverLabel2={isComparing ? driverLabel2 : undefined}
          />

          {/* Main panels grid */}
          <div className="grid gap-4 lg:grid-cols-2">
            <SectorTimesPanel
              laps={laps}
              isLoading={lapsLoading}
              error={lapsError}
              teamColor={teamColor}
              laps2={isComparing ? laps2 : undefined}
              teamColor2={isComparing ? teamColor2 : undefined}
              driverLabel={isComparing ? driverLabel : undefined}
              driverLabel2={isComparing ? driverLabel2 : undefined}
            />
            <PositionPanel
              positions={positions}
              intervals={intervals}
              laps={laps}
              isLoading={positionsLoading}
              error={positionsError}
              teamColor={teamColor}
              positions2={isComparing ? positions2 : undefined}
              intervals2={isComparing ? intervals2 : undefined}
              laps2={isComparing ? laps2 : undefined}
              teamColor2={isComparing ? teamColor2 : undefined}
              driverLabel={isComparing ? driverLabel : undefined}
              driverLabel2={isComparing ? driverLabel2 : undefined}
            />
          </div>

          {/* Speed Trap Panel — full width */}
          <SpeedTrapPanel
            laps={laps}
            isLoading={lapsLoading}
            error={lapsError}
            teamColor={teamColor}
            laps2={isComparing ? laps2 : undefined}
            teamColor2={isComparing ? teamColor2 : undefined}
            driverLabel={isComparing ? driverLabel : undefined}
            driverLabel2={isComparing ? driverLabel2 : undefined}
          />

          {/* Tire Strategy — full width */}
          <TireStrategyPanel
            stints={stints}
            isLoading={stintsLoading}
            error={stintsError}
            teamColor={teamColor}
            stints2={isComparing ? stints2 : undefined}
            teamColor2={isComparing ? teamColor2 : undefined}
            driverLabel={isComparing ? driverLabel : undefined}
            driverLabel2={isComparing ? driverLabel2 : undefined}
          />
        </div>
      )}

      {/* No session key but driver selected — data not available */}
      {selectedDriverNumber && !sessionKey && !sessionsLoading && (
        <Card className="border-border/30 bg-card/50">
          <CardContent className="flex flex-col items-center gap-2 py-8 text-center">
            <Gauge className="h-8 w-8 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">
              Telemetry data for this race is not available from OpenF1.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
