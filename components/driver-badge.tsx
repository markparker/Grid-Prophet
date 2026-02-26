// Team colours and names for 2026 F1 season
export const TEAM_META: Record<string, { color: string; shortName: string }> = {
  red_bull:      { color: "#3671C6", shortName: "Red Bull" },
  ferrari:       { color: "#E8002D", shortName: "Ferrari" },
  mclaren:       { color: "#FF8000", shortName: "McLaren" },
  mercedes:      { color: "#27F4D2", shortName: "Mercedes" },
  aston_martin:  { color: "#229971", shortName: "Aston Martin" },
  alpine:        { color: "#0093CC", shortName: "Alpine" },
  haas:          { color: "#B6BABD", shortName: "Haas" },
  racing_bulls:  { color: "#6692FF", shortName: "Racing Bulls" },
  williams:      { color: "#64C4FF", shortName: "Williams" },
  audi:          { color: "#C1C700", shortName: "Audi" },
  cadillac:      { color: "#FFFFFF", shortName: "Cadillac" },
}

interface DriverBadgeProps {
  teamId: string
  shortName: string   // e.g. "VER"
  firstName: string
  lastName: string
  number?: number
  compact?: boolean   // smaller pill for dropdowns
}

export function DriverBadge({
  teamId,
  shortName,
  firstName,
  lastName,
  number,
  compact = false,
}: DriverBadgeProps) {
  const team = TEAM_META[teamId] ?? { color: "#888888", shortName: "Unknown" }

  if (compact) {
    return (
      <span className="flex items-center gap-2">
        {/* Team colour bar */}
        <span
          className="inline-block h-4 w-1 flex-shrink-0 rounded-full"
          style={{ backgroundColor: team.color }}
          aria-hidden="true"
        />
        <span className="font-mono text-xs font-bold" style={{ color: team.color }}>
          {shortName}
        </span>
        <span className="text-xs">
          {firstName} {lastName}
        </span>
        <span className="ml-auto text-[10px] text-muted-foreground">{team.shortName}</span>
      </span>
    )
  }

  return (
    <span className="flex items-center gap-2.5">
      {/* Team colour stripe */}
      <span
        className="inline-block h-5 w-1 flex-shrink-0 rounded-full"
        style={{ backgroundColor: team.color }}
        aria-hidden="true"
      />
      {/* Number badge */}
      {number !== undefined && (
        <span
          className="flex h-5 w-6 flex-shrink-0 items-center justify-center rounded text-[10px] font-black"
          style={{
            backgroundColor: team.color + "22",
            color: team.color,
            border: `1px solid ${team.color}44`,
          }}
        >
          {number}
        </span>
      )}
      <span className="font-mono text-xs font-bold" style={{ color: team.color }}>
        {shortName}
      </span>
      <span className="flex-1 text-xs font-medium">
        {firstName} {lastName}
      </span>
      <span className="ml-auto flex-shrink-0 rounded-sm px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground"
        style={{ backgroundColor: team.color + "18" }}>
        {team.shortName}
      </span>
    </span>
  )
}
