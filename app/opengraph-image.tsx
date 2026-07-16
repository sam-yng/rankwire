import { ImageResponse } from "next/og";

export const alt = "Rankwire — Personal engineering dispatch";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        alignItems: "center",
        background: "#fbfbf9",
        color: "#141414",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        justifyContent: "center",
        padding: "72px",
        width: "100%",
      }}
    >
      <div
        style={{
          borderBottom: "8px solid #141414",
          borderTop: "2px solid #141414",
          display: "flex",
          flexDirection: "column",
          padding: "30px 0 34px",
          textAlign: "center",
          width: "100%",
        }}
      >
        <div
          style={{
            fontSize: 22,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
          }}
        >
          Personal engineering dispatch
        </div>
        <div
          style={{
            fontFamily: "serif",
            fontSize: 132,
            letterSpacing: "-0.04em",
            lineHeight: 1,
            marginTop: 26,
          }}
        >
          Rankwire
        </div>
      </div>
      <div
        style={{
          fontSize: 26,
          letterSpacing: "0.04em",
          marginTop: 44,
          textAlign: "center",
        }}
      >
        Ranked news from engineering voices worth following.
      </div>
    </div>,
    size,
  );
}
