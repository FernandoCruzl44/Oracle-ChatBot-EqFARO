// app/routes/home.tsx
import { redirect } from "react-router";

// Redirect to the root route
export function loader() {
  return redirect("/");
}

export default function Home() {
  return null;
}
