import type { Route } from "./+types/home";

export function meta(_args: Route.MetaArgs) {
	return [
		{ title: "UnchainedX" },
		{
			name: "description",
			content:
				"UnchainedX is a creative venture studio designing and expanding value, networks, and human potential through technology and creativity.",
		},
	];
}

export default function Home() {
	return (
		<div className="min-h-screen flex items-center justify-center">
			<h1 className="text-4xl font-bold text-neon-cyan">UnchainedX</h1>
		</div>
	);
}
