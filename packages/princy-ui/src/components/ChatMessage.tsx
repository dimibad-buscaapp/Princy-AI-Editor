import { animationClasses } from "../animations/index.js";

export type ChatMessageProps = {
  role: "user" | "assistant" | "system";
  content: string;
  thinking?: string;
  toolCalls?: Array<{ name: string; status: string }>;
  streaming?: boolean;
  animations?: boolean;
};

export function ChatMessage({ role, content, thinking, toolCalls, streaming, animations }: ChatMessageProps) {
  const anim = animations !== false;
  return (
    <div className={`chat-msg chat-msg-${role}`}>
      <div className="chat-msg-role">{role}</div>
      {thinking ? (
        <div className={`thinking-block ${anim ? animationClasses.thinking : ""}`}>
          <h4>Thinking</h4>
          <div className="thinking-content">{thinking}</div>
        </div>
      ) : null}
      {toolCalls?.map((tc, i) => (
        <div key={i} className={`tool-call ${anim ? animationClasses.toolRunning : ""}`}>
          <span className="tool-name">{tc.name}</span>
          <span className="tool-status">{tc.status}</span>
        </div>
      ))}
      <div className={`chat-msg-body ${streaming && anim ? animationClasses.streamingCursor : ""}`}>
        {content || (streaming ? "▌" : "")}
      </div>
    </div>
  );
}
