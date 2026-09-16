type PositionMapProps = {
  primaryPosition?: string | null;
  secondaryPosition?: string | null;
};

const positions: Record<
  string,
  { top: string; left: string; label: string }
> = {
  GK: { top: "86%", left: "50%", label: "GK" },

  LB: { top: "70%", left: "15%", label: "LB" },
  LWB: { top: "61%", left: "14%", label: "LWB" },
  CB: { top: "70%", left: "50%", label: "CB" },
  RB: { top: "70%", left: "85%", label: "RB" },
  RWB: { top: "61%", left: "86%", label: "RWB" },

  DM: { top: "55%", left: "50%", label: "DM" },
  CDM: { top: "55%", left: "50%", label: "CDM" },
  CM: { top: "45%", left: "50%", label: "CM" },
  LM: { top: "43%", left: "20%", label: "LM" },
  RM: { top: "43%", left: "80%", label: "RM" },

  CAM: { top: "34%", left: "50%", label: "CAM" },
  AM: { top: "34%", left: "50%", label: "AM" },

  LW: { top: "24%", left: "22%", label: "LW" },
  RW: { top: "24%", left: "78%", label: "RW" },
  CF: { top: "20%", left: "50%", label: "CF" },
  ST: { top: "13%", left: "50%", label: "ST" },
  FW: { top: "13%", left: "50%", label: "FW" },
};

const normalizePosition = (position: string | null | undefined) => {
  if (!position) return null;

  const value = position.trim().toUpperCase();

  if (value.includes("GOAL")) return "GK";

  if (value.includes("CENTER BACK") || value === "CENTRE BACK") {
    return "CB";
  }

  if (value.includes("LEFT BACK")) return "LB";
  if (value.includes("RIGHT BACK")) return "RB";

  if (value.includes("LEFT WING BACK")) return "LWB";
  if (value.includes("RIGHT WING BACK")) return "RWB";

  if (value.includes("DEFENSIVE MID")) return "DM";
  if (value.includes("CENTRAL MID")) return "CM";

  if (value.includes("LEFT MID")) return "LM";
  if (value.includes("RIGHT MID")) return "RM";

  if (value.includes("ATTACKING MID")) return "CAM";

  if (value.includes("LEFT WING")) return "LW";
  if (value.includes("RIGHT WING")) return "RW";

  if (value.includes("CENTER FORWARD")) return "CF";
  if (value.includes("CENTRE FORWARD")) return "CF";

  if (value.includes("STRIKER")) return "ST";
  if (value.includes("FORWARD")) return "FW";

  if (positions[value]) return value;

  return null;
};

export default function PositionMap({
  primaryPosition,
  secondaryPosition,
}: PositionMapProps) {
  const primary = normalizePosition(primaryPosition);
  const secondary = normalizePosition(secondaryPosition);

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 190,
        aspectRatio: "4 / 5",
        marginTop: 12,
        borderRadius: 10,
        overflow: "hidden",
        position: "relative",
        background: "#171717",
        border: "1px solid #333",
      }}
    >
      {/* OUTER PITCH */}
      <div
        style={{
          position: "absolute",
          inset: 10,
          border: "1px solid #777",
        }}
      />

      {/* HALF WAY LINE */}
      <div
        style={{
          position: "absolute",
          left: 10,
          right: 10,
          top: "50%",
          borderTop: "1px solid #777",
        }}
      />

      {/* CENTER CIRCLE */}
      <div
        style={{
          position: "absolute",
          width: "25%",
          aspectRatio: "1",
          left: "37.5%",
          top: "37.5%",
          border: "1px solid #777",
          borderRadius: "50%",
        }}
      />

      {/* CENTER SPOT */}
      <div
        style={{
          position: "absolute",
          width: 4,
          height: 4,
          left: "calc(50% - 2px)",
          top: "calc(50% - 2px)",
          borderRadius: "50%",
          background: "#777",
        }}
      />

      {/* TOP PENALTY BOX */}
      <div
        style={{
          position: "absolute",
          width: "48%",
          height: "15%",
          left: "26%",
          top: 10,
          border: "1px solid #777",
          borderTop: "none",
        }}
      />

      {/* TOP GOAL BOX */}
      <div
        style={{
          position: "absolute",
          width: "20%",
          height: "7%",
          left: "40%",
          top: 10,
          border: "1px solid #777",
          borderTop: "none",
        }}
      />

      {/* BOTTOM PENALTY BOX */}
      <div
        style={{
          position: "absolute",
          width: "48%",
          height: "15%",
          left: "26%",
          bottom: 10,
          border: "1px solid #777",
          borderBottom: "none",
        }}
      />

      {/* BOTTOM GOAL BOX */}
      <div
        style={{
          position: "absolute",
          width: "20%",
          height: "7%",
          left: "40%",
          bottom: 10,
          border: "1px solid #777",
          borderBottom: "none",
        }}
      />

      {/* POSITION MARKERS */}
      {primary && positions[primary] && (
        <div
          style={{
            position: "absolute",
            top: positions[primary].top,
            left: positions[primary].left,
            transform: "translate(-50%, -50%)",
            width: 42,
            height: 42,
            borderRadius: "50%",
            background: "#f5f4ef",
            color: "#111",
            border: "3px solid #111",
            boxShadow: "0 0 0 2px #f5f4ef",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 11,
            fontWeight: 800,
            zIndex: 3,
          }}
        >
          {positions[primary].label}
        </div>
      )}

      {secondary &&
        secondary !== primary &&
        positions[secondary] && (
          <div
            style={{
              position: "absolute",
              top: positions[secondary].top,
              left: positions[secondary].left,
              transform: "translate(-50%, -50%)",
              width: 34,
              height: 34,
              borderRadius: "50%",
              background: "#111",
              color: "#f5f4ef",
              border: "2px solid #f5f4ef",
              boxShadow: "0 0 0 1px #111",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 10,
              fontWeight: 800,
              zIndex: 2,
            }}
          >
            {positions[secondary].label}
          </div>
        )}
    </div>
  );
}
