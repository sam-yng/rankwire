import { redirect } from "next/navigation";

/** Legacy sign-in URL. Root is now the canonical sign-in entry point. */
export default function SignInPage() {
  redirect("/");
}
