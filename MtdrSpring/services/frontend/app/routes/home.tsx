// app/routes/home.tsx
import { redirect } from "react-router";

export function loader() {
  return redirect("/");
}

export default function Home() {
  return null;
}
