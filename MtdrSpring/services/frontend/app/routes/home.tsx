// app/routes/home.tsx
import { redirect } from "react-router";

// This is just a redirect to the root route
export function loader() {
  return redirect("/");
}

export default function Home() {
  return null;
}
