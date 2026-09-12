import { createFileRoute } from "@tanstack/react-router";
import { OwnerDeskPage } from "@/components/owner-desk";

export const Route = createFileRoute("/desk")({
  component: OwnerDeskPage,
});
