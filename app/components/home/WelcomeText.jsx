'use client';

const WelcomeText = () => {
  // This runs every render but creates consistent, pure output
  const particles = Array(20).fill(null).map(() => ({
    width: Math.random() * 6 + 2,
    height: Math.random() * 6 + 2,
    left: Math.random() * 100,
    top: Math.random() * 100,
    animationDuration: Math.random() * 10 + 15,
    animationDelay: Math.random() * 5,
  }));

  return (
    <div>
      {/* Welcome text with animated navy background */}
      <div
        className="relative overflow-hidden rounded-2xl p-8"
        style={{
          animation: "shadeChange 8s ease-in-out infinite",
          background: "linear-gradient(135deg, #000B18, #00172D, #002142, #001F3F, #000B18)",
          backgroundSize: "400% 400%",
          boxShadow: "0 20px 40px rgba(0,10,30,0.8), inset 0 0 60px rgba(0,50,100,0.3)"
        }}
      >
        {/* Floating particles */}
        {particles.map((particle, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white opacity-10"
            style={{
              width: particle.width + "px",
              height: particle.height + "px",
              left: particle.left + "%",
              top: particle.top + "%",
              animation: `float ${particle.animationDuration}s linear infinite`,
              animationDelay: particle.animationDelay + "s",
              filter: "blur(1px)",
              pointerEvents: "none"
            }}
          />
        ))}

        {/* Larger glowing orbs */}
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(circle at 30% 40%, rgba(0,150,255,0.08) 0%, transparent 50%)",
            animation: "moveOrb 20s ease-in-out infinite",
            pointerEvents: "none"
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(circle at 70% 60%, rgba(100,200,255,0.06) 0%, transparent 50%)",
            animation: "moveOrb2 18s ease-in-out infinite",
            pointerEvents: "none"
          }}
        />

        {/* Subtle wave effect */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: "repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(0,100,200,0.02) 20px, rgba(0,100,200,0.02) 40px)",
            animation: "wave 15s linear infinite",
            pointerEvents: "none"
          }}
        />
        
        {/* Animated shimmer effect */}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.02), transparent)",
            animation: "shimmer 6s infinite",
            transform: "skewX(-20deg)",
            pointerEvents: "none"
          }}
        />
        
        <h1
          className="
            relative z-10
            text-center 
            text-4xl sm:text-xl md:text-2xl lg:text-6xl xl:text-7xl 
            font-black 
            bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 
            bg-clip-text 
            text-transparent 
            tracking-tight 
            leading-none 
            py-4 
            px-2 
            drop-shadow-lg 
            uppercase
            [text-shadow:_0_4px_12px_rgb(0_0_0_/_40%),_0_8px_20px_rgb(0_30_60_/_50%)]
            hover:scale-105 
            transition-transform 
            duration-300 
            cursor-default
          "
          style={{
            fontFamily: "'Playfair Display', 'Times New Roman', serif",
            letterSpacing: "-0.02em",
          }}
        >
          WELCOME TO LIZ FASHIONS
        </h1>
      </div>

      {/* Keyframes for animations - using regular style tag */}
      <style>
        {`
          @keyframes shadeChange {
            0% { background-position: 0% 0%; }
            25% { background-position: 100% 0%; }
            50% { background-position: 100% 100%; }
            75% { background-position: 0% 100%; }
            100% { background-position: 0% 0%; }
          }
          
          @keyframes float {
            0% { transform: translateY(0) translateX(0); opacity: 0; }
            10% { opacity: 0.2; }
            90% { opacity: 0.2; }
            100% { transform: translateY(-100vh) translateX(20px); opacity: 0; }
          }
          
          @keyframes moveOrb {
            0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.4; }
            33% { transform: translate(5%, 5%) scale(1.2); opacity: 0.6; }
            66% { transform: translate(-5%, -5%) scale(0.8); opacity: 0.3; }
          }
          
          @keyframes moveOrb2 {
            0%, 100% { transform: translate(0, 0) scale(1.2); opacity: 0.3; }
            33% { transform: translate(-5%, 5%) scale(0.8); opacity: 0.5; }
            66% { transform: translate(5%, -5%) scale(1.4); opacity: 0.2; }
          }
          
          @keyframes wave {
            0% { background-position: 0 0; }
            100% { background-position: 100px 100px; }
          }
          
          @keyframes shimmer {
            0% { transform: translateX(-100%) skewX(-20deg); }
            100% { transform: translateX(200%) skewX(-20deg); }
          }
        `}
      </style>
    </div>
  );
};

export default WelcomeText;