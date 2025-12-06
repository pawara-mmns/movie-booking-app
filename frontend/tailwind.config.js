/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "#0F172A", // Slate 900
                surface: "#1E293B",    // Slate 800
                surfaceHighlight: "#334155", // Slate 700
                primary: "#D97706",    // Amber 600 (Professional Gold/Bronze)
                secondary: "#64748B",  // Slate 500
                accent: "#EF4444",     // Red 500
                text: "#F8FAFC",       // Slate 50
                textMuted: "#94A3B8",  // Slate 400
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            },
            animation: {
                'fade-in': 'fadeIn 0.5s ease-out',
                'slide-up': 'slideUp 0.5s ease-out',
                'pulse-glow': 'pulseGlow 2s infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(20px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                pulseGlow: {
                    '0%, 100%': { boxShadow: '0 0 5px #FFD700' },
                    '50%': { boxShadow: '0 0 20px #FFD700' },
                }
            }
        },
    },
    plugins: [],
}
