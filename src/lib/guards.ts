import { redirect } from "next/navigation";
import { getSessionUser } from "./session";

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

export function requireStaffRole(user: any, roles: string[]) {
  if (user.userType !== "staff" || !roles.includes(user.staff.role)) {
    throw new Error("Forbidden");
  }
}
