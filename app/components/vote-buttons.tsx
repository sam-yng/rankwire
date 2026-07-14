"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { VoteValue } from "@/lib/votes";
import { StickerButton } from "./ui";

type VoteButtonsProps = {
  articleId: string;
  initialVote: VoteValue | null;
};

export function VoteButtons({ articleId, initialVote }: VoteButtonsProps) {
  const router = useRouter();
  const [vote, setVote] = useState<VoteValue | null>(initialVote);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setVote(initialVote), [initialVote]);

  async function submit(nextVote: VoteValue) {
    if (pending) return;

    const previousVote = vote;
    setVote(nextVote);
    setPending(true);
    setError(null);

    try {
      const response = await fetch("/api/vote", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ articleId, value: nextVote }),
      });
      if (!response.ok) throw new Error(`Vote failed with ${response.status}`);

      const result = (await response.json()) as { value: VoteValue };
      setVote(result.value);
      router.refresh();
    } catch {
      setVote(previousVote);
      setError("Vote failed. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <fieldset className="m-0 flex gap-2 border-0 p-0">
        <legend className="sr-only">Article vote</legend>
        <StickerButton
          variant="keep"
          active={vote === 1}
          disabled={pending}
          aria-label="Vote up"
          onClick={() => submit(1)}
        >
          ↑ Up
        </StickerButton>
        <StickerButton
          variant="skip"
          active={vote === -1}
          disabled={pending}
          aria-label="Vote down"
          onClick={() => submit(-1)}
        >
          ↓ Down
        </StickerButton>
      </fieldset>
      {error ? (
        <span role="alert" className="font-mono text-[9px] uppercase text-meta">
          {error}
        </span>
      ) : null}
    </div>
  );
}
