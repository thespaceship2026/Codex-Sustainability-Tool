// MissionControlFooter — the ship's bridge readout at the bottom of the page.

type Props = {
  mode: string;
  lastSyncLabel: string;
  version?: string;
};

export function MissionControlFooter({
  mode,
  lastSyncLabel,
  version = "v0.5"
}: Props) {
  return (
    <footer className="mc">
      <div className="wrap row">
        <div className="brand2">
          The Spaceship Academy
          <span className="k" style={{ marginLeft: 10 }}>·</span>
          <span className="v" style={{ textTransform: "none", letterSpacing: 0 }}>
            {" "}
            Orbit {version}
          </span>
        </div>
        <div>
          <span className="k">MODE</span>
          <span className="v">{mode}</span>
        </div>
        <div>
          <span className="k">LAST SYNC</span>
          <span className="v">{lastSyncLabel}</span>
        </div>
        <div className="live">TELEMETRY LIVE</div>
      </div>
    </footer>
  );
}
