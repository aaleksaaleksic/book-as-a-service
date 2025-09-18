

export const dt = {
    layouts: {
        mainPage: "min-h-screen bg-reading-background",
        authPage: "min-h-screen bg-gradient-to-br from-book-green-100 via-book-green-50 to-reading-surface",
        pageContainer: "max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8",
        readerContainer: "max-w-4xl mx-auto py-8 px-6",
    },

    typography: {
        pageTitle: "text-3xl font-bold text-reading-text font-ui",
        sectionTitle: "text-2xl font-semibold text-reading-text font-ui",
        subsectionTitle: "text-xl font-medium text-reading-text font-ui",
        cardTitle: "text-lg font-semibold text-reading-text font-ui",
        body: "text-base text-reading-text font-ui",
        muted: "text-sm text-reading-text/70 font-ui",
        small: "text-xs text-reading-text/60 font-ui",
        reading: "text-lg leading-relaxed text-reading-text font-reading",
        button: "text-base font-medium font-ui",
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
        buttonPrimary: "bg-reading-accent hover:bg-reading-accent/90 text-white font-medium py-3 px-6 rounded-lg transition-colors",
        buttonSecondary: "bg-reading-surface hover:bg-book-green-100 text-reading-text border border-reading-accent/20 font-medium py-3 px-6 rounded-lg transition-colors",
        buttonGhost: "hover:bg-book-green-100 text-reading-text font-medium py-3 px-6 rounded-lg transition-colors",

        input: "w-full px-4 py-3 border border-reading-accent/20 rounded-lg focus:ring-2 focus:ring-reading-accent/20 focus:border-reading-accent bg-reading-surface text-reading-text",

        link: "text-reading-accent hover:text-reading-accent/80 underline transition-colors",
    },

    components: {
        // Card styling
        card: "bg-reading-surface border border-reading-accent/10 rounded-xl shadow-sm hover:shadow-md transition-shadow",

        // Book card specific
        bookCard: "bg-reading-surface rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:scale-105",

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