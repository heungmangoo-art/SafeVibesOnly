"use client";

/**
 * Wraps page content in a visible iMac-style frame (bezel, chin, stand).
 * Use on both home and result pages so the app appears inside an iMac screen.
 */
export function ImacFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-8 px-4 bg-[#38383a]">
      <div className="w-full max-w-4xl mx-auto">
        {/* Bezel: visible silver frame around the screen */}
        <div
          className="rounded-[2rem] p-3 sm:p-4 overflow-hidden"
          style={{
            background: "linear-gradient(145deg, #6b6b6e 0%, #525255 50%, #4a4a4d 100%)",
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.08), 0 0 0 1px rgba(0,0,0,0.3), 0 20px 60px -20px rgba(0,0,0,0.5)",
          }}
        >
          {/* Screen: inner content area */}
          <div
            className="rounded-[1.25rem] overflow-hidden min-h-[480px] flex flex-col bg-[#0d1117]"
            style={{
              boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.4), inset 0 0 80px rgba(0,0,0,0.3)",
            }}
          >
            {children}
          </div>
          {/* Chin */}
          <div
            className="h-4 rounded-b-xl mt-0.5"
            style={{
              background: "linear-gradient(180deg, #4a4a4d 0%, #3d3d40 100%)",
              boxShadow: "inset 0 2px 4px rgba(255,255,255,0.06)",
            }}
          />
        </div>
        {/* Stand */}
        <div className="flex justify-center -mt-1">
          <div
            className="w-20 h-6 rounded-b-sm relative"
            style={{
              background: "linear-gradient(180deg, #525255 0%, #404043 100%)",
              boxShadow: "0 6px 20px rgba(0,0,0,0.4)",
            }}
          />
        </div>
        <div
          className="mx-auto -mt-3 w-28 h-5 rounded-full opacity-90"
          style={{
            background: "#2a2a2c",
            boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
          }}
        />
      </div>
    </div>
  );
}
