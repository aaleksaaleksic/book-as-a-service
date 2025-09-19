/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            // ReadBookHub brand colors
            colors: {
                library: {
                    midnight: '#0B1D3A',
                    azure: '#133C5D',
                    gold: '#E4B34C',
                    highlight: '#54A6FF',
                    parchment: '#F5F1E6',
                    linen: '#E0D8C7',
                    charcoal: '#1F2933',
                    slate: '#A5B4C7',
                    copper: '#B65C33',
                    mint: '#22D1B2',
                    violet: '#7F5AF0',
                    fog: '#F2F5F7',
                    gray: '#8896A5',
                },
                reading: {
                    background: '#0B1D3A',
                    surface: '#F5F1E6',
                    surfaceAlt: '#E0D8C7',
                    accent: '#E4B34C',
                    text: '#1F2933',
                    contrast: '#F5F1E6',
                    highlight: '#54A6FF',
                },
            },
            fontFamily: {
                display: ['var(--font-playfair)', 'Playfair Display', 'serif'],
                reading: ['var(--font-inter)', 'Inter', 'sans-serif'],
                ui: ['var(--font-inter)', 'Inter', 'sans-serif'],
            },
            screens: {
                'xs': '475px',   // Small phones
                'sm': '640px',   // Phones landscape
                'md': '768px',   // Tablets
                'lg': '1024px',  // Small laptops
                'xl': '1280px',  // Desktops
                '2xl': '1536px', // Large screens
            },
            spacing: {
                '18': '4.5rem',   // Custom spacing for reading
                '88': '22rem',    // Large containers
            },
            // Animation for smooth transitions
            animation: {
                'fade-in': 'fadeIn 0.3s ease-in-out',
                'slide-up': 'slideUp 0.3s ease-out',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(10px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
            },
        },
    },
    plugins: [],
}