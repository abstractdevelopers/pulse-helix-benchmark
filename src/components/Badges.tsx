export function StatusBadge({ status }: { status: string }) {
  const labels: Record<string, string> = {
    investigating: "Investigating",
    identified: "Identified",
    monitoring: "Monitoring",
    resolved: "Resolved",
  };

  return (
    <span className={`badge badge-${status}`}>
      {labels[status] ?? status}
    </span>
  );
}

export function SeverityBadge({ severity }: { severity: string }) {
  const labels: Record<string, string> = {
    low: "Low",
    medium: "Medium",
    high: "High",
    critical: "Critical",
  };

  return (
    <span className={`badge badge-${severity}`}>
      {labels[severity] ?? severity}
    </span>
  );
}