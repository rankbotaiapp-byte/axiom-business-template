import { createFileRoute } from "@tanstack/react-router";
import { AxiomApp } from "@/components/axiom-app";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <AxiomApp />;
}
