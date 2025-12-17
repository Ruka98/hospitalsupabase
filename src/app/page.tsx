import { getSessionUser } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function Home() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  redirect("/dashboard");
}
