import "./GlobalAnimatedBackground.css";

const flowers = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  left: `${(i * 37 + 7) % 100}%`,
  delay: `${-i * 1.7}s`,
  duration: `${12 + (i % 5) * 2}s`,
}));

export default function GlobalAnimatedBackground() {
  return (
    <div className="global-animated-background" aria-hidden="true">
      <div className="global-glow glow-one" />
      <div className="global-glow glow-two" />
      <div className="global-glow glow-three" />

      {flowers.map((flower) => (
        <span
          key={flower.id}
          className="global-flower"
          style={{
            left: flower.left,
            animationDelay: flower.delay,
            animationDuration: `${flower.duration}s`,
          }}
        >
          ❀
        </span>
      ))}
    </div>
  );
}
