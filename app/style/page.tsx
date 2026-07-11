import type { Metadata } from "next";
import { Showcase } from "./showcase";

export const metadata: Metadata = {
  title: "Young Post — design system",
  description: "Token + primitive proof sheet for the design system.",
};

// Proof sheet for m5.5. Renders every token and primitive in both themes via
// data-theme-scoped panels. Mock data only — no session, no DB.
export default function StylePage() {
  return (
    <main>
      <section data-theme="light" className="bg-page text-fg">
        <div className="mx-auto w-full max-w-[1080px] px-6 pt-8">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-meta">
            light theme
          </span>
        </div>
        <Showcase />
      </section>
      <section data-theme="dark" className="bg-page text-fg">
        <div className="mx-auto w-full max-w-[1080px] px-6 pt-8">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-meta">
            dark theme
          </span>
        </div>
        <Showcase />
      </section>
    </main>
  );
}
