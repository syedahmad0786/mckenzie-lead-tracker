export function CampaignChip({ name, color }: { name: string; color?: string | null }) {
  const accent = color || "var(--brand, #00a7e0)";
  return (
    <span
      className="chip"
      style={{
        color: accent,
        borderColor: `${accent}55`,
        backgroundColor: `${accent}10`,
      }}
    >
      {name}
    </span>
  );
}
