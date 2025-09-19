

export const dt = {
    layouts: {
        mainPage: "min-h-screen bg-gradient-to-b from-library-midnight via-library-azure/95 to-library-midnight",
        authPage: "min-h-screen bg-gradient-to-br from-library-midnight via-library-azure to-library-highlight/20",
        pageContainer: "max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8",
        readerContainer: "max-w-4xl mx-auto px-6 py-8",
    },

    typography: {
        pageTitle: "text-3xl font-semibold font-display text-reading-text",
        sectionTitle: "text-2xl font-semibold font-display text-reading-text",
        subsectionTitle: "text-xl font-medium font-display text-reading-text",
        cardTitle: "text-lg font-semibold font-display text-reading-text",
        body: "text-base text-reading-text font-ui",
        muted: "text-sm text-reading-text/70 font-ui",
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
        primary: "book-green-600",
        primaryHover: "book-green-700",
        primaryLight: "book-green-100",
        // Background colors
        background: "reading-background",
        surface: "reading-surface",
        // Text colors
        text: "reading-text",
        textMuted: "reading-text/70",
        // State colors
        success: "green-600",
        warning: "yellow-500",
        error: "red-600",
        info: "blue-600",
    },

    interactive: {
        buttonPrimary: "bg-reading-accent text-reading-text font-semibold py-3 px-6 rounded-full shadow-[0_18px_40px_rgba(228,179,76,0.25)] transition-transform hover:-translate-y-0.5 hover:bg-library-gold/90",
        buttonSecondary: "border border-reading-accent/20 bg-reading-surface text-reading-text font-semibold py-3 px-6 rounded-full transition-colors hover:bg-library-highlight/10",
        buttonGhost: "text-reading-text font-semibold py-3 px-6 rounded-full transition-colors hover:bg-library-highlight/10",

        input: "w-full px-4 py-3 border border-reading-accent/20 rounded-lg focus:ring-2 focus:ring-reading-accent/20 focus:border-reading-accent bg-reading-surface text-reading-text",

        link: "text-reading-accent hover:text-reading-accent/80 underline transition-colors",
    },

    components: {
        // Card styling
        card: "bg-reading-surface border border-reading-accent/15 rounded-3xl shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl",

        // Book card specific
        bookCard: "bg-reading-surface rounded-[28px] overflow-hidden shadow-xl transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl",

        // Navigation
        nav: "sticky top-0 z-50 w-full bg-reading-background/80 backdrop-blur-sm",

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
        heroTitle: "text-4xl sm:text-5xl lg:text-6xl",
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