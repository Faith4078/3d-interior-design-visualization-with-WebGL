"use client";

import dynamic from "next/dynamic";

// WebGL needs the browser, so the studio is never rendered on the server.
const Studio = dynamic(() => import("./Studio"), {
  ssr: false,
  loading: () => (
    <div className="flex h-dvh items-center justify-center bg-zinc-950 text-sm text-zinc-400">Loading 3D studio…</div>
  ),
});

export default function Designer() {
  return <Studio />;
}
