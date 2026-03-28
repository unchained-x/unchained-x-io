import { index, type RouteConfig, route } from "@react-router/dev/routes";

export default [
	index("routes/home.tsx"),
	route("portfolio", "routes/portfolio.tsx"),
	route("team", "routes/team.tsx"),
	route("merch", "routes/merch.tsx"),
	route("company", "routes/company.tsx"),
	route("legal", "routes/legal.tsx"),
] satisfies RouteConfig;
