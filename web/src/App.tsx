import { useEffect, useState } from "react";
import { MapView } from "./MapView";

type Health = {
  ok: boolean;
  database: boolean;
  postgis: string | null;
  modelKeyConfigured: boolean;
  error: string | null;
};

type HealthState =
  | { status: "loading" }
  | { status: "unreachable" }
  | { status: "loaded"; health: Health };

export function App() {
  const [state, setState] = useState<HealthState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    fetch("/api/health")
      .then((res) => res.json() as Promise<Health>)
      .then((health) => {
        if (!cancelled) setState({ status: "loaded", health });
      })
      .catch(() => {
        if (!cancelled) setState({ status: "unreachable" });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="layout">
      <aside className="panel">
        <h1>Texas Trip Planner</h1>
        <p className="muted">Describe a camping or hiking trip and get a plan on the map.</p>

        <h2>Setup status</h2>
        <StatusList state={state} />
      </aside>
      <MapView />
    </div>
  );
}

function StatusList({ state }: { state: HealthState }) {
  if (state.status === "loading") return <p className="muted">Checking…</p>;
  if (state.status === "unreachable") {
    return <Check ok={false} label="Backend API" detail="Not reachable on port 3001" />;
  }
  const { health } = state;
  return (
    <ul className="checks">
      <Check ok label="Backend API" detail="Running" />
      <Check
        ok={health.database}
        label="Database"
        detail={health.database ? "Connected" : (health.error ?? "Not connected")}
      />
      <Check
        ok={health.postgis !== null}
        label="PostGIS"
        detail={health.postgis ?? "Extension not found"}
      />
      <Check
        ok={health.modelKeyConfigured}
        label="Model API key"
        detail={health.modelKeyConfigured ? "Set" : "Missing from .env"}
      />
    </ul>
  );
}

function Check({ ok, label, detail }: { ok: boolean; label: string; detail: string }) {
  return (
    <li className="check">
      <span className={ok ? "dot dot-ok" : "dot dot-bad"} aria-hidden />
      <span>
        <strong>{label}</strong>
        <span className="muted"> — {ok ? "" : "Problem: "}{detail}</span>
      </span>
    </li>
  );
}
