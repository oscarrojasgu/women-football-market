type PositionMapProps = {
  primaryPosition?: string | null;
  secondaryPosition?: string | null;
};

type PositionData = {
  top: string;
  left: string;
  label: string;
};

const positions: Record<string, PositionData> = {
  GK: { top: "86%", left: "50%", label: "GK" },

  LB: { top: "68%", left: "17%", label: "LB" },
  LWB: { top: "59%", left: "14%", label: "LWB" },
  CB: { top: "70%", left: "50%", label: "CB" },
  RB: { top: "68%", left: "83%", label: "RB" },
  RWB: { top: "59%", left: "86%", label: "RWB" },

  DM: { top: "56%", left: "50%", label: "DM" },
  CDM: { top: "56%", left: "50%", label: "CDM" },

  LM: { top: "46%", left: "17%", label: "LM" },
  CM: { top: "45%", left: "50%", label: "CM" },
  RM: { top: "46%", left: "83%", label: "RM" },

  CAM: { top: "34%", left: "50%", label: "CAM" },
  AM: { top: "34%", left: "50%", label: "AM" },

  LW: { top: "25%", left: "22%", label: "LW" },
  RW: { top: "25%", left: "78%", label: "RW" },

  CF: { top: "20%", left: "50%", label: "CF" },
  ST: { top: "13%", left: "50%", label: "ST" },
  FW: { top: "13%", left: "50%", label: "FW" },
};

const normalizePosition = (position: string | null | undefined) => {
  if (!position) return null;

  const value = position.trim().toUpperCase();

  if (!value) return null;

  if (positions[value]) {
    return value;
  }

  if (
    value === "GOALKEEPER" ||
    value === "GOAL KEEPER" ||
    value.includes("GOALKEEPER")
  ) {
    return "GK";
  }

  if (
    value === "DEFENDER" ||
    value === "DEFENCE" ||
    value === "DEFENSE" ||
    value === "CENTER BACK" ||
    value === "CENTRE BACK" ||
    value === "CENTER-BACK" ||
    value === "CENTRE-BACK" ||
    value === "CENTRAL DEFENDER" ||
    value === "CENTRAL DEFENCE"
  ) {
    return "CB";
  }

  if (
    value === "LEFT BACK" ||
    value === "LEFT-BACK" ||
    value === "LEFT FULLBACK" ||
    value === "LEFT FULL BACK"
  ) {
    return "LB";
  }

  if (
    value === "RIGHT BACK" ||
    value === "RIGHT-BACK" ||
    value === "RIGHT FULLBACK" ||
    value === "RIGHT FULL BACK"
  ) {
    return "RB";
  }

  if (
    value === "LEFT WING BACK" ||
    value === "LEFT WING-BACK"
  ) {
    return "LWB";
  }

  if (
    value === "RIGHT WING BACK" ||
    value === "RIGHT WING-BACK"
  ) {
    return "RWB";
  }

  if (
    value === "DEFENSIVE MIDFIELDER" ||
    value === "DEFENSIVE MIDFIELD" ||
    value === "DEFENSIVE MID"
  ) {
    return "DM";
  }

  if (
    value === "MIDFIELDER" ||
    value === "MIDFIELD" ||
    value === "CENTRAL MIDFIELDER" ||
    value === "CENTRAL MIDFIELD" ||
    value === "CENTRAL MID" ||
    value === "CENTER MIDFIELDER" ||
    value === "CENTER MIDFIELD" ||
    value === "CENTER MID"
  ) {
    return "CM";
  }

  if (
    value === "LEFT MIDFIELDER" ||
    value === "LEFT MIDFIELD" ||
    value === "LEFT MID"
  ) {
    return "LM";
  }

  if (
    value === "RIGHT MIDFIELDER" ||
    value === "RIGHT MIDFIELD" ||
    value === "RIGHT MID"
  ) {
    return "RM";
  }

  if (
    value === "ATTACKING MIDFIELDER" ||
    value === "ATTACKING MIDFIELD" ||
    value === "ATTACKING MID" ||
    value === "OFFENSIVE MIDFIELDER" ||
    value === "OFFENSIVE MIDFIELD"
  ) {
    return "CAM";
  }

  if (
    value === "LEFT WINGER" ||
    value === "LEFT WING"
  ) {
    return "LW";
  }

  if (
    value === "RIGHT WINGER" ||
    value === "RIGHT WING"
  ) {
    return "RW";
  }

  if (
    value === "CENTER FORWARD" ||
    value === "CENTRE FORWARD" ||
    value === "CENTER-FORWARD" ||
    value === "CENTRE-FORWARD"
  ) {
    return "CF";
  }

  if (
    value === "STRIKER" ||
    value === "CENTER STRIKER" ||
    value === "CENTRE STRIKER"
  ) {
    return "ST";
  }

  if (
    value === "FORWARD" ||
    value === "FORWARDER"
  ) {
    return "FW";
  }

  return null;
};

const getNumericPosition = (position: string) => {
  const data = positions[position];

  return {
    top: parseFloat(data.top),
    left: parseFloat(data.left),
  };
};

const getSecondaryOffset = (
  primary: string | null,
  secondary: string | null
) => {
  if (!primary || !secondary || primary === secondary) {
    return { x: 0, y: 0 };
  }

  const primaryPoint = getNumericPosition(primary);
  const secondaryPoint = getNumericPosition(secondary);

  const dx = secondaryPoint.left - primaryPoint.left;
  const dy = secondaryPoint.top - primaryPoint.top;

  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance >= 18) {
    return { x: 0, y: 0 };
  }

  if (Math.abs(dx) < 4 && Math.abs(dy) < 4) {
    return { x: 25, y: 0 };
  }

  if (Math.abs(dx) < 8) {
    return {
      x: 24,
      y: 0,
    };
  }

  if (Math.abs(dy) < 8) {
    return {
      x: 0,
      y: dy > 0 ? 22 : -22,
    };
  }

  return {
    x: dx > 0 ? 14 : -14,
    y: dy > 0 ? 14 : -14,
  };
};

export default function PositionMap({
  primaryPosition,
  secondaryPosition,
}: PositionMapProps) {
  const primary = normalizePosition(primaryPosition);
  const secondary = normalizePosition(secondaryPosition);

  const secondaryOffset = getSecondaryOffset(primary, secondary);

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 190,
        marginTop: 12,
      }}
    >
      <div
        style={{
          width: "100%",
          aspectRatio: "4 / 5",
          borderRadius: 10,
          overflow: "hidden",
          position: "relative",
          background: "#171717",
          border: "1px solid #333",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 10,
            border: "1px solid #777",
          }}
        />

        <div
          style={{
            position: "absolute",
            left: 10,
            right: 10,
            top: "50%",
            borderTop: "1px solid #777",
          }}
        />

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
                transform: `translate(calc(-50% + ${secondaryOffset.x}px), calc(-50% + ${secondaryOffset.y}px))`,
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
                zIndex: 4,
              }}
            >
              {positions[secondary].label}
            </div>
          )}
      </div>

      {(primary || secondary) && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 16,
            marginTop: 8,
            fontSize: 10,
            color: "#aaa",
            whiteSpace: "nowrap",
          }}
        >
          {primary && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: "#f5f4ef",
                  border: "1px solid #111",
                  display: "inline-block",
                }}
              />
              <span>Primary</span>
            </div>
          )}

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
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: "#111",
                  border: "1px solid #f5f4ef",
                  display: "inline-block",
                }}
              />
              <span>Secondary</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
