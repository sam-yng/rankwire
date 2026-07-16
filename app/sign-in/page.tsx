import { redirect } from "next/navigation";

/** Hyphenated legacy alias for the canonical root sign-in page. */
export default function HyphenatedSignInPage() {
  redirect("/");
}
