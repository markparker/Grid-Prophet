import { fetchStints } from "@/lib/openf1"
import { createDriverTelemetryRoute } from "@/lib/telemetry-route"

export const GET = createDriverTelemetryRoute("stints", "stints", fetchStints)
