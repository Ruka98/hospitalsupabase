import { redirect } from "next/navigation";
import { getSessionUser } from "./session";

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

import { SessionUser } from "./session";

export function requireStaffRole(user: SessionUser, roles: string[]): asserts user is Extract<SessionUser, { userType: "staff" }> {
  if (user.userType !== "staff" || !roles.includes(user.staff.role)) {
    throw new Error("Forbidden");
  }
}
