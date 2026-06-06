"use client";

const STARS = Array.from({ length: 80 }, (_, i) => ({
  id: i,
  left: `${(i * 17 + 7) % 100}%`,
  top: `${(i * 23 + 11) % 100}%`,
  delay: `${(i % 5) * 0.6}s`,
  size: i % 7 === 0 ? 3 : 2
}));

const FLOATERS = Array.from({ length: 16 }, (_, i) => ({
  id: i,
  left: `${(i * 31 + 5) % 95}%`,
  top: `${(i * 19 + 8) % 90}%`,
  delay: `${i * 0.4}s`,
  duration: `${5 + (i % 4)}s`
}));

export function NeuralParticles() {
  return (
    <div className="neural-particles" aria-hidden>
      <div className="neural-particles__nebula neural-particles__nebula--blue" />
      <div className="neural-particles__nebula neural-particles__nebula--violet" />
      <div className="neural-particles__nebula neural-particles__nebula--center" />
      {STARS.map((star) => (
        <span
          key={star.id}
          className="neural-particles__star"
          style={{
            left: star.left,
            top: star.top,
            width: star.size,
            height: star.size,
            animationDelay: star.delay
          }}
        />
      ))}
      {FLOATERS.map((f) => (
        <span
          key={f.id}
          className="neural-particles__float"
          style={{
            left: f.left,
            top: f.top,
            animationDelay: f.delay,
            animationDuration: f.duration
          }}
        />
      ))}
    </div>
  );
}
