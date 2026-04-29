'use client'

import { motion } from 'framer-motion'

interface AnimatedBackgroundProps {
  variant: 'login' | 'register'
}

export default function AnimatedBackground({ variant }: AnimatedBackgroundProps) {
  if (variant === 'login') {
    return (
      <div className="absolute inset-0 overflow-hidden -z-10">
        {/* Animated Gradient Background */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-primary-500 via-primary-400 to-primary-600"
          animate={{
            background: [
              'linear-gradient(135deg, #0ea5e9 0%, #38bdf8 50%, #0284c7 100%)',
              'linear-gradient(225deg, #0284c7 0%, #0ea5e9 50%, #38bdf8 100%)',
              'linear-gradient(315deg, #38bdf8 0%, #0284c7 50%, #0ea5e9 100%)',
              'linear-gradient(135deg, #0ea5e9 0%, #38bdf8 50%, #0284c7 100%)',
            ],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: 'linear',
          }}
        />

        {/* Floating Bubbles */}
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white opacity-20"
            style={{
              width: Math.random() * 100 + 50,
              height: Math.random() * 100 + 50,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -100, 0],
              x: [0, Math.sin(i) * 50, 0],
              scale: [1, 1.2, 1],
              opacity: [0.2, 0.3, 0.2],
            }}
            transition={{
              duration: 8 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: 'easeInOut',
            }}
          />
        ))}

        {/* Animated Wave */}
        <motion.div
          className="absolute bottom-0 left-0 right-0"
          style={{ height: '200px' }}
          animate={{
            clipPath: [
              'polygon(0 80%, 100% 70%, 100% 100%, 0 100%)',
              'polygon(0 60%, 100% 75%, 100% 100%, 0 100%)',
              'polygon(0 80%, 100% 65%, 100% 100%, 0 100%)',
            ],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <div className="w-full h-full bg-gradient-to-t from-primary-700/30 to-transparent" />
        </motion.div>

        {/* Gradient Orbs */}
        <motion.div
          className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full bg-primary-300/30 blur-3xl"
          animate={{
            x: [0, 50, 0],
            y: [0, -50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute bottom-1/4 left-1/4 w-96 h-96 rounded-full bg-primary-400/30 blur-3xl"
          animate={{
            x: [0, -50, 0],
            y: [0, 50, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>
    )
  }

  // Register page variant
  return (
    <div className="absolute inset-0 overflow-hidden -z-10">
      {/* Animated Gradient Background */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
        }}
        animate={{
          background: [
            'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
            'linear-gradient(225deg, #764ba2 0%, #f093fb 50%, #667eea 100%)',
            'linear-gradient(315deg, #f093fb 0%, #667eea 50%, #764ba2 100%)',
            'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
          ],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'linear',
        }}
      />

      {/* Animated Particles */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: Math.random() * 8 + 4,
            height: Math.random() * 8 + 4,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            background: `hsl(${Math.random() * 60 + 240}, 70%, ${Math.random() * 30 + 60}%)`,
          }}
          animate={{
            y: [0, -800, 0],
            x: [0, Math.sin(i) * 100, 0],
            opacity: [0, 1, 0.5, 0],
            scale: [0, 1, 1, 0],
          }}
          transition={{
            duration: 10 + Math.random() * 10,
            repeat: Infinity,
            delay: Math.random() * 5,
            ease: 'linear',
          }}
        />
      ))}

      {/* Mesh Gradient Orbs */}
      <motion.div
        className="absolute top-0 left-0 w-[600px] h-[600px] rounded-full bg-purple-400/40 blur-3xl"
        animate={{
          x: [0, 200, 0],
          y: [0, 200, 0],
          scale: [1, 1.3, 1],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <motion.div
        className="absolute bottom-0 right-0 w-[600px] h-[600px] rounded-full bg-pink-400/40 blur-3xl"
        animate={{
          x: [0, -200, 0],
          y: [0, -200, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-indigo-400/30 blur-3xl"
        animate={{
          scale: [1, 1.4, 1],
          rotate: [0, 360],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'linear',
        }}
      />

      {/* Grid Pattern Overlay */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />
    </div>
  )
}

