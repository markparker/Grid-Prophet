import { fetchLaps } from "@/lib/openf1"
import { createDriverTelemetryRoute } from "@/lib/telemetry-route"

export const GET = createDriverTelemetryRoute("laps", "laps", fetchLaps)
