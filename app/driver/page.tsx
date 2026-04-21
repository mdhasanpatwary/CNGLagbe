import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth";

export default async function DriverRoot() {
  const user = await getAuthUser();
  
  if (user && user.role === "DRIVER") {
    redirect("/dashboard");
  } else {
    redirect("/login");
  }
}
