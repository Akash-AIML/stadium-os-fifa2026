/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // ─── Semantic surface tokens (CSS variable driven) ───────────────────
        background:   "hsl(var(--bg))",
        surface:      "hsl(var(--surface))",
        elevated:     "hsl(var(--elevated))",
        floating:     "hsl(var(--floating))",
        border:       "hsl(var(--border))",
        ring:         "hsl(var(--ring))",
        foreground:   "hsl(var(--fg))",
        muted:        "hsl(var(--muted))",
        "muted-fg":   "hsl(var(--muted-fg))",

        // ─── Primary accent (cyan) ─────────────────────────────────────────
        primary: {
          DEFAULT: "hsl(var(--primary))",
          hover:   "hsl(var(--primary-hover))",
          subtle:  "hsl(var(--primary-subtle))",
          fg:      "hsl(var(--primary-fg))",
        },

        // ─── Secondary accent (violet/purple) ─────────────────────────────
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          subtle:  "hsl(var(--secondary-subtle))",
        },

        // ─── Semantic status colors ────────────────────────────────────────
        status: {
          clear:     "#10b981",  // emerald-500
          moderate:  "#f59e0b",  // amber-500
          busy:      "#f97316",  // orange-500
          critical:  "#ef4444",  // red-500
        },

        // ─── FIFA Sport Palette ───────────────────────────────────────────
        sport: {
          cyan:    "#06b6d4",
          violet:  "#a855f7",
          emerald: "#10b981",
          amber:   "#f59e0b",
          orange:  "#f97316",
          red:     "#ef4444",
          blue:    "#2563eb",
          gold:    "#fbbf24",
        },
      },

      // ─── Typography ──────────────────────────────────────────────────────
      fontFamily: {
        sans:    ["Inter", "Outfit", "system-ui", "sans-serif"],
        display: ["Space Grotesk", "Inter", "system-ui", "sans-serif"],
        mono:    ["JetBrains Mono", "Fira Code", "monospace"],
        num:     ["'Roboto Mono'", "JetBrains Mono", "monospace"],
      },

      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "0.875rem" }],   // 10px
        "3xl":  ["1.875rem", { lineHeight: "2.25rem"  }],
        "4xl":  ["2.25rem",  { lineHeight: "2.5rem"   }],
        "5xl":  ["3rem",     { lineHeight: "1"         }],
      },

      // ─── Border Radius system ────────────────────────────────────────────
      borderRadius: {
        "sm":  "6px",
        "md":  "8px",
        "lg":  "12px",  // cards & inputs
        "xl":  "16px",  // major panels
        "2xl": "20px",  // hero panels
        "3xl": "24px",  // modal/sheet
      },

      // ─── Shadow system ───────────────────────────────────────────────────
      boxShadow: {
        // Elevation-based (semantic)
        "surface":  "0 1px 3px 0 hsl(var(--shadow-color) / 0.08), 0 1px 2px -1px hsl(var(--shadow-color) / 0.08)",
        "elevated": "0 4px 16px -2px hsl(var(--shadow-color) / 0.16), 0 2px 8px -2px hsl(var(--shadow-color) / 0.1)",
        "floating": "0 20px 48px -8px hsl(var(--shadow-color) / 0.3), 0 8px 20px -4px hsl(var(--shadow-color) / 0.15)",
        "dialog":   "0 32px 64px -12px hsl(var(--shadow-color) / 0.5)",

        // Glow effects (sport-grade)
        "glow-cyan":    "0 0 0 1px rgba(6, 182, 212, 0.15), 0 4px 20px rgba(6, 182, 212, 0.25)",
        "glow-violet":  "0 0 0 1px rgba(168, 85, 247, 0.15), 0 4px 20px rgba(168, 85, 247, 0.25)",
        "glow-emerald": "0 0 0 1px rgba(16, 185, 129, 0.15), 0 4px 20px rgba(16, 185, 129, 0.25)",
        "glow-amber":   "0 0 0 1px rgba(245, 158, 11, 0.15), 0 4px 20px rgba(245, 158, 11, 0.25)",
        "glow-red":     "0 0 0 1px rgba(239, 68, 68, 0.15), 0 4px 20px rgba(239, 68, 68, 0.25)",

        // Focus ring (accessibility)
        "focus":        "0 0 0 2px hsl(var(--bg)), 0 0 0 4px hsl(var(--primary))",
      },

      // ─── Backdrop blur scale ─────────────────────────────────────────────
      backdropBlur: {
        xs:   "2px",
        sm:   "8px",
        md:   "12px",
        lg:   "20px",
        xl:   "32px",
        "2xl":"48px",
        "4xl":"72px",
      },

      // ─── Background images ───────────────────────────────────────────────
      backgroundImage: {
        "gradient-radial":  "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":   "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "mesh-dark":        "linear-gradient(135deg, rgba(6,182,212,0.06) 0%, rgba(168,85,247,0.06) 50%, rgba(16,185,129,0.04) 100%)",
        "mesh-light":       "linear-gradient(135deg, rgba(37,99,235,0.04) 0%, rgba(168,85,247,0.04) 50%, rgba(16,185,129,0.03) 100%)",
        "stadium-glow":     "radial-gradient(ellipse at center, rgba(6,182,212,0.15) 0%, transparent 70%)",
        "pitch-stripe":     "repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(255,255,255,0.015) 40px, rgba(255,255,255,0.015) 80px)",
      },

      // ─── Animation ───────────────────────────────────────────────────────
      animation: {
        // Micro (200ms)
        "scale-in":     "scaleIn 200ms cubic-bezier(0.4, 0, 0.2, 1) both",
        "fade-in":      "fadeIn 200ms cubic-bezier(0.4, 0, 0.2, 1) both",

        // Standard (300ms)
        "slide-up":     "slideUp 300ms cubic-bezier(0.4, 0, 0.2, 1) both",
        "slide-down":   "slideDown 300ms cubic-bezier(0.4, 0, 0.2, 1) both",
        "slide-right":  "slideRight 300ms cubic-bezier(0.4, 0, 0.2, 1) both",

        // Transitions (500ms)
        "modal-in":     "modalIn 500ms cubic-bezier(0.32, 0.72, 0, 1) both",

        // Perpetual
        "pulse-zone":   "pulseZone 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "pulse-glow":   "pulseGlow 2s ease-in-out infinite",
        "route-flow":   "routeFlow 1.2s linear infinite",
        "float":        "float 6s ease-in-out infinite",
        "shimmer":      "shimmer 2s linear infinite",
        "typing-dot":   "typingDot 1.4s ease-in-out infinite",
        "spin-slow":    "spin 20s linear infinite",
        "breathe":      "breathe 4s ease-in-out infinite",
      },

      keyframes: {
        fadeIn:    { from: { opacity: "0" },                                        to: { opacity: "1" } },
        scaleIn:   { from: { opacity: "0", transform: "scale(0.95)" },              to: { opacity: "1", transform: "scale(1)" } },
        slideUp:   { from: { opacity: "0", transform: "translateY(12px)" },         to: { opacity: "1", transform: "translateY(0)" } },
        slideDown: { from: { opacity: "0", transform: "translateY(-12px)" },        to: { opacity: "1", transform: "translateY(0)" } },
        slideRight:{ from: { opacity: "0", transform: "translateX(-12px)" },        to: { opacity: "1", transform: "translateX(0)" } },
        modalIn:   { from: { opacity: "0", transform: "scale(0.96) translateY(8px)" }, to: { opacity: "1", transform: "scale(1) translateY(0)" } },

        pulseZone: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%":      { opacity: "0.75", transform: "scale(1.05)" },
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 8px rgba(6,182,212,0.3)" },
          "50%":       { boxShadow: "0 0 24px rgba(6,182,212,0.6), 0 0 40px rgba(168,85,247,0.2)" },
        },
        routeFlow: { to: { strokeDashoffset: "-20" } },
        float: {
          "0%, 100%": { transform: "translateY(0) translateX(0)" },
          "33%":      { transform: "translateY(-8px) translateX(4px)" },
          "66%":      { transform: "translateY(4px) translateX(-4px)" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        typingDot: {
          "0%, 60%, 100%": { opacity: "0.2", transform: "scale(0.8)" },
          "30%":            { opacity: "1",   transform: "scale(1)" },
        },
        breathe: {
          "0%, 100%": { opacity: "0.6", transform: "scale(1)" },
          "50%":      { opacity: "1",   transform: "scale(1.02)" },
        },
      },

      // ─── Transition timing functions ─────────────────────────────────────
      transitionTimingFunction: {
        "sport":    "cubic-bezier(0.4, 0, 0.2, 1)",
        "spring":   "cubic-bezier(0.32, 0.72, 0, 1)",
        "bounce":   "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
        "smooth":   "cubic-bezier(0.4, 0, 0.6, 1)",
      },

      transitionDuration: {
        "150":  "150ms",
        "200":  "200ms",
        "300":  "300ms",
        "400":  "400ms",
        "500":  "500ms",
        "600":  "600ms",
        "1000": "1000ms",
      },
    },
  },
  plugins: [],
}