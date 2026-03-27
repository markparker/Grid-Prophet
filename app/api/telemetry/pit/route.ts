import { fetchPit } from "@/lib/openf1"
import { createDriverTelemetryRoute } from "@/lib/telemetry-route"

export const GET = createDriverTelemetryRoute("pit", "pits", fetchPit)
