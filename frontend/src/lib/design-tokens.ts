

export const dt = {
    layouts: {
        mainPage: "min-h-screen bg-gradient-to-b from-library-midnight via-library-azure/95 to-library-midnight",
        library: "min-h-screen bg-library-parchment/95",
        authPage: "min-h-screen bg-gradient-to-br from-library-midnight via-library-azure to-library-highlight/20",
        pageContainer: "max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8",
        readerContainer: "max-w-4xl mx-auto px-6 py-8",
    },

    typography: {
        // Main headings use Bebas Neue
        heroTitle: "font-bebas font-normal leading-tight text-sky-950",
        pageTitle: "text-4xl font-normal font-bebas text-reading-text sm:text-5xl",
        sectionTitle: "text-3xl font-normal font-bebas text-reading-text sm:text-4xl",
        subsectionTitle: "text-2xl font-normal font-bebas text-reading-text",
        cardTitle: "text-3xl font-normal font-bebas text-reading-text",
        stepTitle: "text-2xl font-normal font-bebas text-reading-text",
        // Body text uses Inter
        body: "text-base text-reading-text font-ui",
        muted: "text-base text-reading-text/70 font-ui",
        small: "text-xs text-reading-text/60 font-ui",
        reading: "text-lg leading-relaxed text-reading-text font-reading",
        button: "text-base font-semibold font-ui",
    },

    spacing: {
        pageSections: "py-16 lg:py-20",
        cardContent: "space-y-6",
        formFields: "space-y-4",
        componentSpacing: "space-y-3",
        gridGap: "gap-6",
        cardPadding: "p-6",
        compactPadding: "p-4",
    },


    colors: {
        // Primary brand colors
        primary: "library-gold",
        primaryHover: "library-gold/90",
        primaryLight: "library-gold/15",
        secondary: "sky-950",
        secondaryLight: "library-azure",
        // Background colors
        background: "library-parchment/95",
        backgroundDark: "sky-950",
        surface: "reading-surface",
        surfaceLight: "library-parchment/95",
        // Text colors
        text: "reading-text",
        textLight: "white",
        textDark: "sky-950",
        textMuted: "reading-text/70",
        textContrast: "sky-950/90",
        // Accent colors
        accent: "library-gold",
        highlight: "library-highlight",
        // State colors
        success: "green-600",
        warning: "yellow-500",
        error: "red-600",
        info: "blue-600",
    },

    interactive: {
        buttonPrimary: "bg-library-gold text-library-midnight font-semibold py-6 px-10 rounded-full shadow-[0_18px_40px_rgba(228,179,76,0.25)] transition-transform hover:-translate-y-1 hover:bg-library-gold/90",
        buttonSecondary: "border border-library-gold/30 bg-transparent text-sky-950 font-semibold py-6 px-10 rounded-full transition hover:bg-library-azure/40",
        buttonGhost: "text-reading-text font-semibold py-5 px-6 rounded-full border border-library-gold/25 bg-library-azure/10 transition hover:bg-library-highlight/10",

        input: "w-full px-4 py-3 border border-reading-accent/20 rounded-lg focus:ring-2 focus:ring-reading-accent/20 focus:border-reading-accent bg-reading-surface text-reading-text",

        link: "text-library-gold hover:text-library-gold/80 underline transition-colors",
        navLink: "text-lg font-medium text-white transition-colors hover:text-library-gold",
    },

    components: {
        // Card styling
        card: "bg-library-parchment/95 border border-library-highlight/30 rounded-[32px] shadow-[0_30px_80px_rgba(4,12,28,0.45)] backdrop-blur transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_40px_100px_rgba(4,12,28,0.55)]",

        // Book card specific
        bookCard: "bg-library-parchment/95 border border-library-highlight/30 rounded-[32px] p-6 text-reading-text shadow-[0_30px_80px_rgba(4,12,28,0.45)] backdrop-blur transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_40px_100px_rgba(4,12,28,0.55)]",

        // Navigation
        navbar: "w-full border-b border-white/10 bg-sky-950",
        navLink: "text-lg font-medium text-white transition-colors hover:text-library-gold",

        // Badge
        badge: "rounded-full bg-library-gold/15 text-sky-950",

        // Info box
        infoBox: "rounded-3xl border border-library-highlight/30 bg-library-azure/40 p-6 shadow-[0_20px_60px_rgba(6,18,38,0.6)] backdrop-blur",

        // Step card
        stepCard: "relative rounded-3xl border border-library-gold/15 bg-white/80 p-6 shadow-[0_18px_45px_rgba(31,41,51,0.12)] backdrop-blur",

        // Modal/overlay
        modal: "bg-reading-surface border border-reading-accent/20 rounded-xl shadow-2xl",
        overlay: "bg-black/50 backdrop-blur-sm",
    },

    responsive: {
        // Grid responsive patterns
        bookGrid: "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6",
        categoryGrid: "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4",

        // Navigation responsive
        navMobile: "lg:hidden",
        navDesktop: "hidden lg:flex",

        // Text responsive
        heroTitle: "text-3xl sm:text-5xl lg:text-6xl",
        heroSubtitle: "text-lg sm:text-xl lg:text-2xl",
    },

    // Animation presets
    animations: {
        // Page transitions
        pageEnter: "animate-fade-in",
        slideUp: "animate-slide-up",

        hoverScale: "hover:scale-105 transition-transform duration-200",
        hoverGlow: "hover:shadow-lg hover:shadow-reading-accent/20 transition-shadow duration-300",
    },
};