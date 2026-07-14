"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { InvalidPreferencesError, savePreferences } from "@/lib/preferences";
import { TAG_NAMES } from "@/lib/tags";

export type PreferencesActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

export async function savePreferencesAction(
  _previousState: PreferencesActionState,
  formData: FormData,
): Promise<PreferencesActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { status: "error", message: "Sign in required." };
  }

  const values = TAG_NAMES.map((tag) => ({
    tag,
    weight: parseWeight(formData.get(`weight:${tag}`)),
  }));

  try {
    await savePreferences(session.user.id, values);
    revalidatePath("/");
    revalidatePath("/preferences");
    return { status: "success", message: "Preferences saved. Feed rescored." };
  } catch (error) {
    if (!(error instanceof InvalidPreferencesError)) {
      console.error("Preference mutation failed", error);
    }
    return {
      status: "error",
      message:
        error instanceof InvalidPreferencesError
          ? "Enter a finite number for every tag."
          : "Save failed. Try again.",
    };
  }
}

function parseWeight(value: FormDataEntryValue | null): number {
  return typeof value === "string" && value.trim() !== "" ? Number(value) : Number.NaN;
}
