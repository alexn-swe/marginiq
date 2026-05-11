import { redirect } from "next/navigation";

// Redirect the root URL "/" to "/dashboard"
export default function Home() {
  redirect("/dashboard");
}
