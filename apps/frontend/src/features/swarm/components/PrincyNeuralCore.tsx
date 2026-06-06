"use client";

type PrincyNeuralCoreProps = {
  active?: boolean;
};

export function PrincyNeuralCore({ active: _active }: PrincyNeuralCoreProps) {
  return (
    <div className="princy-neural-core" aria-hidden>
      <svg
        className="princy-neural-core__svg"
        viewBox="0 0 1024 682"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="Princy Neural Core"
      >
        <image
          href="/princy/swarm/princy-neural-core.webp"
          width="1024"
          height="682"
          preserveAspectRatio="xMidYMid meet"
        />
      </svg>
    </div>
  );
}
