type PositionMapProps = {
  primaryPosition?: string | null;
  secondaryPosition?: string | null;
};

const positions = [
  { key: "GK", label: "GK", top: "88%", left: "50%" },
  { key: "LB", label: "LB", top: "69%", left: "20%" },
  { key: "CB", label: "CB", top: "71%", left: "40%" },
  { key: "RCB", label: "CB", top: "71%", left: "60%" },
  { key: "RB", label: "RB", top: "69%", left: "80%" },
  { key: "DM", label: "DM", top: "55%", left: "50%" },
  { key: "LM", label: "LM", top: "45%", left: "20%" },
  { key: "CM", label: "CM", top: "45%", left: "40%" },
  { key: "RCM", label: "CM", top: "45%", left: "60%" },
  { key: "RM", label: "RM", top: "45%", left: "80%" },
  { key: "AM", label: "AM", top: "34%", left: "50%" },
  { key: "LW", label: "LW", top: "23%", left: "23%" },
  { key: "RW", label: "RW", top: "23%", left: "77%" },
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
        maxWidth: 190,
        marginTop: 10,
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "4 / 5",
          borderRadius: 9,
          overflow: "hidden",
          background: "#171717",
          border: "1px solid #292929",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 7,
            border: "1px solid rgba(245,244,239,0.35)",
            borderRadius: 2,
          }}
        />

        <div
          style={{
            position: "absolute",
            left: 7,
            right: 7,
            top: "50%",
            height: 1,
            background: "rgba(245,244,239,0.3)",
          }}
        />

        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: 34,
            height: 34,
            border: "1px solid rgba(245,244,239,0.3)",
            borderRadius: "50%",
            transform: "translate(-50%, -50%)",
          }}
        />

        <div
          style={{
            position: "absolute",
            left: "25%",
            right: "25%",
            top: 7,
            height: "17%",
            border: "1px solid rgba(245,244,239,0.3)",
            borderTop: "none",
          }}
        />

        <div
          style={{
            position: "absolute",
            left: "25%",
            right: "25%",
            bottom: 7,
            height: "17%",
            border: "1px solid rgba(245,244,239,0.3)",
            borderBottom: "none",
          }}
        />

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
                width: isPrimary ? 29 : 25,
                height: isPrimary ? 29 : 25,
                borderRadius: "50%",
                background: isPrimary ? "#f5f4ef" : "#111",
                color: isPrimary ? "#111" : "#f5f4ef",
                border: isPrimary
                  ? "1px solid #111"
                  : "1px solid #f5f4ef",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 7,
                fontWeight: 800,
                boxShadow: "0 2px 5px rgba(0,0,0,0.3)",
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
          gap: 12,
          marginTop: 7,
          fontSize: 10,
          color: "#777",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: "#111",
              display: "inline-block",
            }}
          />
          Primary
        </div>

        {secondary && secondary !== primary && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "#f5f4ef",
                border: "1px solid #111",
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
