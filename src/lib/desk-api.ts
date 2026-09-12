import { createServerFn } from "@tanstack/react-start";

export type DeskStatus = "booked" | "done" | "no-show";

export type DeskBooking = {
  id: string;
  serviceId: string;
  serviceName: string;
  date: string;
  time: string;
  name: string;
  phone: string;
  status: DeskStatus;
  createdAt: string;
  ping: string;
};

export const unlockDesk = createServerFn({ method: "POST" })
  .validator((input: { pin: string }) => input)
  .handler(async ({ data }) => {
    const { unlock } = await import("./desk-store.server");
    return unlock(data.pin);
  });

export const listDesk = createServerFn({ method: "POST" })
  .validator((input: { token: string }) => input)
  .handler(async ({ data }) => {
    const { list } = await import("./desk-store.server");
    return list(data.token);
  });

export const setDeskStatus = createServerFn({ method: "POST" })
  .validator((input: { token: string; id: string; status: DeskStatus }) => input)
  .handler(async ({ data }) => {
    const { setStatus } = await import("./desk-store.server");
    return setStatus(data.token, data.id, data.status);
  });

export const takenSlots = createServerFn({ method: "POST" })
  .validator(() => ({}))
  .handler(async () => {
    const { taken } = await import("./desk-store.server");
    return taken();
  });

export const placeBooking = createServerFn({ method: "POST" })
  .validator(
    (input: {
      serviceId: string;
      date: string;
      time: string;
      name: string;
      phone: string;
    }) => input,
  )
  .handler(async ({ data }) => {
    const { place } = await import("./desk-store.server");
    return place(data);
  });
