// app/routes.ts
import { type RouteConfig, route, layout } from "@react-router/dev/routes";

export default [
  layout("./routes/home-layout.tsx", [
    route("/", "./views/TaskView.tsx"),
    route("team", "./views/TeamView.tsx"),
    route("productivity", "./views/ProductivityView.tsx"),
  ]),
] satisfies RouteConfig;
