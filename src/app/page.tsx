import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { ROLE_HOME } from "@/lib/rbac/permissions";
import { routes } from "@/config/site";
import { Role } from "@prisma/client";

export default async function RootPage() {
  const session = await auth();

  if (session?.user?.role) {
    redirect(ROLE_HOME[session.user.role as Role]);
  }

  redirect(routes.login);
}
