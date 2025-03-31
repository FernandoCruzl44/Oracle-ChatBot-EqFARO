// app/routes.ts
import { type RouteConfig, route, layout } from "@react-router/dev/routes";

export default [
  layout("./routes/home-layout.tsx", [
    route("/", "./views/TasksView/index.tsx"),
    route("team", "./views/TeamView/index.tsx"),
    route("productivity", "./views/ProductivityView/index.tsx"),
  ]),
] satisfies RouteConfig;
