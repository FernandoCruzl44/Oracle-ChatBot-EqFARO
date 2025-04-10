// app/routes.ts
import { type RouteConfig, route, layout } from "@react-router/dev/routes";

export default [
  route("login", "./views/Auth/Login.tsx"),
  route("register", "./views/Auth/Register.tsx"),

  // Protected routes
  layout("./routes/home-layout.tsx", [
    route("/", "./views/Tasks/index.tsx"),
    route("team", "./views/Team/index.tsx"),
    route("productivity", "./views/Productivity/index.tsx"),
  ]),
] satisfies RouteConfig;
