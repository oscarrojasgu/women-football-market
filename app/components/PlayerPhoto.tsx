import React from "react";

type PlayerPhotoProps = {
  src?: string | null;
  alt?: string;
  width?: number;
  height?: number;
  className?: string;
  style?: React.CSSProperties;
};

export default function PlayerPhoto({
  src,
  alt = "",
  width = 40,
  height = 40,
  className,
  style,
}: PlayerPhotoProps) {
  return (
    <img
      src={src || "/wfm-player-placeholder.svg"}
      alt={alt}
      width={width}
      height={height}
      className={className}
      onError={(event) => {
        if (event.currentTarget.src.endsWith("/wfm-player-placeholder.svg")) return;
        event.currentTarget.src = "/wfm-player-placeholder.svg";
      }}
      style={{
        display: "block",
        width,
        height,
        flexShrink: 0,
        ...style,
      }}
    />
  );
}
