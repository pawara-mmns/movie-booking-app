/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "#121212", // Deep Charcoal
                surface: "#1E1E1E",    // Slightly lighter for cards
                primary: "#FFD700",    // Gold
                secondary: "#00F3FF",  // Neon Blue
                accent: "#E50914",     // Cinematic Red
                text: "#E0E0E0",       // Soft White
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
