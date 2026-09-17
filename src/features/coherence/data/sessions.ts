import { SessionId } from "../types";

export const SESSIONS = {
  "next-step": {
    id: "next-step" as SessionId,
    title: "Coherence Gate → Next Step",
    confirmation: "You are now in coherence. Your system is ready.",
    prompts: [
      "In one short sentence, what is the next micro-action that feels most true and doable right now?",
      "See that action already completed. Notice one detail that feels especially satisfying or real.",
      "Is there any remaining resistance? If yes, name it in a few words. If none, say 'clear'."
    ],
    close: "You have what you need. When you open your eyes, the first thing you will do is the action you just named."
  },
  "morning-priming": {
    id: "morning-priming" as SessionId,
    title: "Morning Priming Gate",
    confirmation: "You are now in coherence. Your system is ready for the day.",
    prompts: [
      "What is the single most important action you will complete today that moves you toward your goal?",
      "See that action already finished. What is one detail that makes it feel real and satisfying?",
      "Is there anything that could pull you off course today? Name it briefly, or say 'clear'."
    ],
    close: "When you open your eyes, that action becomes the first real step of your day."
  },
  "resistance-dissolve": {
    id: "resistance-dissolve" as SessionId,
    title: "Resistance Dissolve",
    confirmation: "You are now in coherence. The resistance can be seen clearly.",
    prompts: [
      "Name the resistance in a few honest words.",
      "What is the smallest true action that is still available even with this resistance present?",
      "See yourself completing that small action. What do you notice?"
    ],
    close: "You do not have to wait for the resistance to disappear. You only have to take the next true step."
  },
  "energy-activation": {
    id: "energy-activation" as SessionId,
    title: "Energy Activation",
    confirmation: "You are now in coherence. Energy is available.",
    prompts: [
      "What is one action that would create even a small increase in energy or momentum right now?",
      "See it already done. What is the most satisfying part?",
      "What will you do immediately after this session?"
    ],
    close: "When you open your eyes, take that action."
  },
  "midday-reset": {
    id: "midday-reset" as SessionId,
    title: "Mid-Day Reset",
    confirmation: "You are now in coherence. The mind can reset.",
    prompts: [
      "What is the most important remaining action for the rest of this day?",
      "What can be released or postponed so that action becomes easier?",
      "See the important action completed. One detail that feels clean and finished."
    ],
    close: "When you open your eyes, return to the important action."
  },
  "evening-integration": {
    id: "evening-integration" as SessionId,
    title: "Evening Integration",
    confirmation: "You are now in coherence. The day can be integrated.",
    prompts: [
      "What is one thing you completed or moved forward today that matters?",
      "What did you learn about yourself or the process?",
      "What is the single clearest intention you will carry into tomorrow?"
    ],
    close: "Tomorrow begins with the intention you just named."
  },
  "celebration": {
    id: "celebration" as SessionId,
    title: "Celebration Lock-In",
    confirmation: "You are now in coherence. This success can be claimed.",
    prompts: [
      "What exactly did you complete?",
      "Who are you becoming by having done this?",
      "What is the next identity-level action that now feels natural?"
    ],
    close: "This is who you are now. Carry that forward."
  },
  "crisis": {
    id: "crisis" as SessionId,
    title: "Crisis Coherence",
    confirmation: "You are now in coherence. You are safe to proceed.",
    prompts: [
      "What is the single smallest next action that is still possible?",
      "Say it clearly."
    ],
    close: "When you open your eyes, do only that."
  }
} as const;