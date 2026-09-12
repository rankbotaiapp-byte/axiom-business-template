import { createServerFn } from "@tanstack/react-start";
import { business } from "@/config/business";
import { axiomBrief } from "@/lib/hours";

type Turn = { role: "user" | "axiom"; text: string };

export const askAxiom = createServerFn({ method: "POST" })
  .validator((input: { messages: Turn[] }) => input)
  .handler(async ({ data }) => {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) {
      return {
        ok: false as const,
        error: `${business.axiomName} is quiet in this environment.`,
      };
    }

    const messages = [
      {
        role: "system" as const,
        content: [
          `You are ${business.axiomName}, a living halo around the ${business.name} page.`,
          business.axiomVoice,
          "Reply in 1–3 short sentences. No lists unless asked. Never mention being an AI model.",
          "",
          axiomBrief(),
        ].join("\n"),
      },
      ...data.messages.slice(-8).map((m) => ({
        role: (m.role === "axiom" ? "assistant" : "user") as
          | "assistant"
          | "user",
        content: m.text.slice(0, 800),
      })),
    ];

    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-4.5",
        messages,
        max_tokens: 180,
        temperature: 0.6,
      }),
    });

    if (!res.ok) {
      return {
        ok: false as const,
        error: `${business.axiomName} could not answer just now.`,
      };
    }

    const body = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = body.choices?.[0]?.message?.content?.trim() ?? "";
    if (!text) {
      return {
        ok: false as const,
        error: `${business.axiomName} had nothing to say.`,
      };
    }
    return { ok: true as const, text };
  });
