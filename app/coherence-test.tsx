import { SessionPlayer } from "../src/features/coherence";

export default function CoherenceTestScreen() {
  return (
    <div style={{ padding: 20, maxWidth: 500, margin: "0 auto" }}>
      <h1 style={{ textAlign: "center", marginBottom: 20 }}>Coherence Test</h1>
      <SessionPlayer 
        sessionId="next-step" 
        onComplete={(result) => {
          console.log("Session completed:", result);
          alert("Session finished! Check the console for the result.");
        }}
      />
    </div>
  );
}
