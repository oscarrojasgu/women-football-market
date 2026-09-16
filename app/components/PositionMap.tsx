type PositionMapProps = {
  primaryPosition?: string | null;
  secondaryPosition?: string | null;
};

const positions = [
  { key: "GK", label: "GK", top: "88%", left: "50%" },

  { key: "LB", label: "LB", top: "68%", left: "18%" },
  { key: "CB", label: "CB", top: "70%", left: "40%" },
  { key: "RCB", label: "CB", top: "70%", left: "60%" },
  { key: "RB", label: "RB", top: "68%", left: "82%" },

  { key: "DM", label: "DM", top: "54%", left: "50%" },

  { key: "LM", label: "LM", top: "45%", left: "20%" },
  { key: "CM", label: "CM", top: "45%", left: "40%" },
  { key: "RCM", label: "CM", top: "45%", left: "60%" },
  { key: "RM", label: "RM", top: "45%", left: "80%" },

  { key: "AM", label: "AM", top: "34%", left: "50%" },

  { key: "LW", label: "LW", top: "22%", left: "22%" },
  { key: "RW", label: "RW", top: "22%", left: "78%" },

  { key: "CF", label: "CF", top: "15%", left: "50%" },
  { key: "ST", label: "ST", top: "9%", left: "50%" },
];

function normalizePosition(position?: string | null) {
  if (!position) return "";

  const value = position.trim().toUpperCase();

  const aliases: Record<string, string> = {
    GOALKEEPER: "GK",
    "CENTRAL DEFENDER": "CB",
    CENTERBACK: "CB",
    CENTREBACK: "CB",
    "CENTRE BACK": "CB",
    "CENTER BACK": "CB",

    "LEFT BACK": "LB",
    "LEFT-BACK": "LB",
    "RIGHT BACK": "RB",
    "RIGHT-BACK": "RB",

    "DEFENSIVE MIDFIELDER": "DM",
    "DEFENSIVE MIDFIELD": "DM",

    MIDFIELDER: "CM",
    "CENTRAL MIDFIELDER": "CM",
    "CENTRAL MIDFIELD": "CM",

    "ATTACKING MIDFIELDER": "AM",
    "ATTACKING MIDFIELD": "AM",

    "LEFT MIDFIELDER": "LM",
    "RIGHT MIDFIELDER": "RM",

    "LEFT WINGER": "LW",
    WINGER: "LW",
    "RIGHT WINGER": "RW",

    FORWARD: "CF",
    STRIKER: "ST",
    "CENTER FORWARD": "CF",
    "CENTRE FORWARD": "CF",
  };

  return aliases[value] || value;
}

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
        maxWidth: 420,
        marginTop: 18,
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "3 / 4",
          borderRadius: 14,
          overflow: "hidden",
          background:
            "linear-gradient(180deg, #4d7c4d 0%, #3f6d3f 50%, #365f36 100%)",
          border: "1px solid #d9d9d9",
        }}
      >
        {/* Pitch markings */}
        <div
          style={{
            position: "absolute",
            inset: 14,
            border: "2px solid rgba(255,255,255,0.8)",
            borderRadius: 2,
          }}
        />

        <div
          style={{
            position: "absolute",
            left: "14%",
            right: "14%",
            top: 14,
            height: "18%",
            border: "2px solid rgba(255,255,255,0.8)",
            borderTop: "none",
          }}
        />

        <div
          style={{
            position: "absolute",
            left: "14%",
            right: "14%",
            bottom: 14,
            height: "18%",
            border: "2px solid rgba(255,255,255,0.8)",
            borderBottom: "none",
          }}
        />

        <div
          style={{
            position: "absolute",
            left: "50%",
            top: 14,
            bottom: 14,
            width: 2,
            background: "rgba(255,255,255,0.8)",
            transform: "translateX(-50%)",
          }}
        />

        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: 70,
            height: 70,
            border: "2px solid rgba(255,255,255,0.8)",
            borderRadius: "50%",
            transform: "translate(-50%, -50%)",
          }}
        />

        {/* Position markers */}
        {positions.map((position) => {
          const isPrimary = position.key === primary;
          const isSecondary = position.key === secondary;

          if (!isPrimary && !isSecondary) return null;

          return (
            <div
              key={position.key}
              style={{
                position: "absolute",
                top: position.top,
                left: position.left,
                transform: "translate(-50%, -50%)",
                width: isPrimary ? 46 : 38,
                height: isPrimary ? 46 : 38,
                borderRadius: "50%",
                background: isPrimary ? "#111" : "#fff",
                color: isPrimary ? "#fff" : "#111",
                border: isPrimary
                  ? "3px solid #fff"
                  : "2px solid #111",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                fontWeight: 800,
                boxShadow: "0 3px 10px rgba(0,0,0,0.25)",
                zIndex: 3,
              }}
            >
              {position.label}
            </div>
          );
        })}
      </div>

      <div
        style={{
          display: "flex",
          gap: 18,
          marginTop: 12,
          fontSize: 12,
          color: "#666",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: "#111",
              border: "2px solid #fff",
              display: "inline-block",
            }}
          />
          Primary
        </div>

        {secondary && (
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <span
              style={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                background: "#fff",
                border: "2px solid #111",
                display: "inline-block",
              }}
            />
            Secondary
          </div>
        )}
      </div>
    </div>
  );
}
