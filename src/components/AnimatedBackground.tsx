export const AnimatedBackground = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Animated gradient background */}
      <div 
        className="absolute inset-0 opacity-70"
        style={{
          background: 'radial-gradient(circle at 50% 0%, hsl(var(--primary) / 0.16), transparent 34%), linear-gradient(-45deg, hsl(var(--primary) / 0.07), hsl(var(--secondary) / 0.08), hsl(var(--primary-glow) / 0.07), hsl(var(--secondary-glow) / 0.06))',
          backgroundSize: '400% 400%',
          animation: 'gradient-shift 15s ease infinite'
        }}
      />
      
      {/* Floating particles */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-gradient-primary opacity-10 blur-3xl"
            style={{
               width: `${Math.random() * 220 + 80}px`,
               height: `${Math.random() * 220 + 80}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${Math.random() * 20 + 15}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 5}s`
            }}
          />
        ))}
      </div>

      {/* Grid overlay */}
      <div 
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: `
            linear-gradient(to right, hsl(262 83% 58% / 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, hsl(262 83% 58% / 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px'
        }}
      />
    </div>
  );
};
