"use client"

import useSWR from "swr"
import type { OpenF1Lap, OpenF1Stint, OpenF1Position, OpenF1Interval, CarStatsSummary } from "@/lib/openf1"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const SWR_OPTIONS = {
  dedupingInterval: 60000,
  revalidateOnFocus: false,
}

export function useTelemetrySessions() {
  const { data, error, isLoading } = useSWR<{
    sessions: Array<{
      session_key: number
      country_name: string
      circuit_short_name: string
      location: string
      date_start: string
      date_end: string
    }>
  }>("/api/telemetry/sessions", fetcher, SWR_OPTIONS)

  return {
    sessions: data?.sessions ?? [],
    isLoading,
    error,
  }
}

export function useLaps(sessionKey: number | null, driverNumber: number | null) {
  const shouldFetch = sessionKey && driverNumber
  const { data, error, isLoading } = useSWR<{ laps: OpenF1Lap[] }>(
    shouldFetch
      ? `/api/telemetry/laps?session_key=${sessionKey}&driver_number=${driverNumber}`
      : null,
    fetcher,
    SWR_OPTIONS
  )

  return {
    laps: data?.laps ?? [],
    isLoading,
    error,
  }
}

export function useStints(sessionKey: number | null, driverNumber: number | null) {
  const shouldFetch = sessionKey && driverNumber
  const { data, error, isLoading } = useSWR<{ stints: OpenF1Stint[] }>(
    shouldFetch
      ? `/api/telemetry/stints?session_key=${sessionKey}&driver_number=${driverNumber}`
      : null,
    fetcher,
    SWR_OPTIONS
  )

  return {
    stints: data?.stints ?? [],
    isLoading,
    error,
  }
}

export function usePositions(sessionKey: number | null, driverNumber: number | null) {
  const shouldFetch = sessionKey && driverNumber
  const { data, error, isLoading } = useSWR<{
    positions: OpenF1Position[]
    intervals: OpenF1Interval[]
  }>(
    shouldFetch
      ? `/api/telemetry/positions?session_key=${sessionKey}&driver_number=${driverNumber}`
      : null,
    fetcher,
    SWR_OPTIONS
  )

  return {
    positions: data?.positions ?? [],
    intervals: data?.intervals ?? [],
    isLoading,
    error,
  }
}

export function useCarStats(sessionKey: number | null, driverNumber: number | null) {
  const shouldFetch = sessionKey && driverNumber
  const { data, error, isLoading } = useSWR<{ stats: CarStatsSummary | null }>(
    shouldFetch
      ? `/api/telemetry/car-stats?session_key=${sessionKey}&driver_number=${driverNumber}`
      : null,
    fetcher,
    SWR_OPTIONS
  )

  return {
    stats: data?.stats ?? null,
    isLoading,
    error,
  }
}
