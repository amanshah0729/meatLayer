"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Create is now inline on /agents; redirect old links.
export default function CreateAgentRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/agents");
  }, [router]);
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d0d0f] text-white/60 text-sm">
      Redirecting to Agents…
    </div>
  );
}
