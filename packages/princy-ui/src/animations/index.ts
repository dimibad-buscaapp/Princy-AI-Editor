/** CSS animation class names — transform/opacity only for performance. */
export const animationClasses = {
  typing: "princy-anim-typing",
  thinking: "princy-anim-thinking",
  streamingCursor: "princy-anim-stream-cursor",
  toolRunning: "princy-anim-tool-running",
  agentWorking: "princy-anim-agent-working",
  patchApplying: "princy-anim-patch-applying",
  memoryLoading: "princy-anim-memory-loading",
  workspaceScan: "princy-anim-workspace-scan",
  autonomousExecution: "princy-anim-autonomous",
  taskComplete: "princy-anim-task-complete"
} as const;

export const animationCss = `
@keyframes princyTyping { 0%,100%{opacity:1} 50%{opacity:.4} }
@keyframes princyThinking { 0%,100%{opacity:.6;transform:scale(1)} 50%{opacity:1;transform:scale(1.02)} }
@keyframes princyStreamCursor { 0%,100%{border-color:var(--cyan)} 50%{border-color:transparent} }
@keyframes princyToolRunning { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
@keyframes princyAgentWorking { 0%,100%{opacity:.7;transform:translateY(0)} 50%{opacity:1;transform:translateY(-2px)} }
@keyframes princyPatchApplying { 0%{opacity:.5} 50%{opacity:1} 100%{opacity:.5} }
@keyframes princyMemoryLoading { 0%,100%{opacity:.4} 50%{opacity:1} }
@keyframes princyWorkspaceScan { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }
@keyframes princyAutonomous { 0%,100%{opacity:.8} 50%{opacity:1} }
@keyframes princyTaskComplete { 0%{transform:scale(.95);opacity:0} 100%{transform:scale(1);opacity:1} }
.princy-anim-typing{animation:princyTyping 1.2s ease-in-out infinite}
.princy-anim-thinking{animation:princyThinking 2s ease-in-out infinite}
.princy-anim-stream-cursor{animation:princyStreamCursor .8s step-end infinite}
.princy-anim-tool-running{animation:princyToolRunning 1s linear infinite;display:inline-block}
.princy-anim-agent-working{animation:princyAgentWorking 1.5s ease-in-out infinite}
.princy-anim-patch-applying{animation:princyPatchApplying 1s ease-in-out infinite}
.princy-anim-memory-loading{animation:princyMemoryLoading 1.2s ease-in-out infinite}
.princy-anim-workspace-scan{animation:princyWorkspaceScan 2s linear infinite;overflow:hidden}
.princy-anim-autonomous{animation:princyAutonomous 2s ease-in-out infinite}
.princy-anim-task-complete{animation:princyTaskComplete .4s ease-out}
.no-motion .princy-anim-typing,.no-motion .princy-anim-thinking,.no-motion .princy-anim-stream-cursor,
.no-motion .princy-anim-tool-running,.no-motion .princy-anim-agent-working,.no-motion .princy-anim-patch-applying,
.no-motion .princy-anim-memory-loading,.no-motion .princy-anim-workspace-scan,.no-motion .princy-anim-autonomous,
.no-motion .princy-anim-task-complete{animation:none!important}
`;
