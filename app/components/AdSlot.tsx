import React from "react";

type AdSlotProps = {
  placement?: "top" | "leaderboard" | "inline" | "sidebar";
  className?: string;
};

export default function AdSlot({ placement = "inline", className = "" }: AdSlotProps) {
  return (
    <div
      className={`ad-slot ad-slot--${placement} ${className}`.trim()}
      data-ad-placement={placement}
      aria-label="Advertisement"
    >
      <span>ADVERTISEMENT</span>
    </div>
  );
}
