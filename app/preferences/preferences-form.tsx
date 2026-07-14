"use client";

import { useActionState } from "react";
import type { PreferenceValue } from "@/lib/preferences";
import { StickerButton } from "../components/ui";
import { type PreferencesActionState, savePreferencesAction } from "./actions";

const INITIAL_STATE: PreferencesActionState = { status: "idle", message: "" };

type PreferencesFormProps = {
  preferences: PreferenceValue[];
};

export function PreferencesForm({ preferences }: PreferencesFormProps) {
  const [state, action, pending] = useActionState(savePreferencesAction, INITIAL_STATE);

  return (
    <form action={action} className="mt-8">
      <div className="grid gap-px border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-3">
        {preferences.map(({ tag, weight }) => (
          <label
            key={tag}
            className="flex items-center justify-between gap-5 bg-surface px-4 py-4"
          >
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-fg">
              {tag}
            </span>
            <input
              name={`weight:${tag}`}
              type="number"
              step="0.5"
              required
              defaultValue={weight}
              aria-label={`${tag} weight`}
              className="w-20 rounded-btn border border-fg bg-page px-2 py-1.5 text-right font-mono text-sm text-fg outline-none focus-visible:ring-2 focus-visible:ring-fg focus-visible:ring-offset-2 focus-visible:ring-offset-page"
            />
          </label>
        ))}
      </div>

      <div className="mt-6 flex min-h-12 flex-wrap items-center justify-between gap-4 border-t border-rule pt-5">
        <p
          role={state.status === "error" ? "alert" : "status"}
          className={`font-mono text-[10px] uppercase tracking-[0.1em] ${
            state.status === "error" ? "text-fg" : "text-meta"
          }`}
        >
          {pending ? "Saving and rescoring…" : state.message || "Step: 0.5"}
        </p>
        <StickerButton type="submit" variant="keep" disabled={pending}>
          {pending ? "Saving…" : "Save preferences"}
        </StickerButton>
      </div>
    </form>
  );
}
