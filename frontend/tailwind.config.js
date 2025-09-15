/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            // ReadBookHub brand colors
            colors: {
                // Primary green palette
                'book-green': {
                    50: '#F8F9FA',
                    100: '#D4EDDA',
                    600: '#6F9654',
                    900: '#2D5016',
                },
                // Reading-specific colors
                'reading': {
                    background: '#D4EDDA',
                    surface: '#F8F9FA',
                    accent: '#6F9654',
                    text: '#2D5016',
                    warning: '#FFF3CD',
                },
                // Circadian rhythm color temperatures (for future use)
                'temperature': {
                    warm: '#FF8C42',    // 2700K
                    neutral: '#FFFFFF', // 5500K
                    cool: '#87CEEB',    // 6500K
                }
            },
            fontFamily: {
                'reading': ['Georgia', 'Times New Roman', 'serif'],
                'ui': ['Inter', 'system-ui', 'sans-serif'],
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