
export const BOOK_CATEGORIES = [
    'Mašinsko učenje',
    'C, C++, C#',
    'Algoritmi',
    'Generativna veštačka inteligencija',
    'Veštačka inteligencija',
    'ChatGPT',
    'Blockchain',
    'Računarstvo u oblaku',
    'Web design',
    'JavaScript',
    'Apple - MAC OS X',
    'Analiza podataka',
    'Funkcionalno programinanje',
    'Git i GitHub',
    'Projektovanje softvera',
    'Visual Basic .NET',
    'Android',
    'PHP, MYSQL',
    'Full Stack Development',
    'Java',
    'Python',
    'SQL',
    'Marketing',
    'WordPress',
    'AutoCad, ArhiCAD, SolidWorks, Catia',
    'Animacija',
    'Audio, Multimedija, Video',
    'Baze podataka',
    'CSS',
    'Delphi',
    'Django',
    'E-komerc',
    'Google',
    'Grafika, dizajn, štampa',
    'Hardver',
    'Internet',
    'Joomla',
    'JQuery',
    'Mreže',
    'MS Office',
    'Obrada teksta',
    'Office 2013',
    'Poslovanje',
    'Programiranje',
    'Raspberry PI',
    'Rečnici',
    'Robotika',
    'Ruby',
    'Sertifikati',
    'Statistika',
    'Tabele',
    'Telekomunikacije',
    'Unix, Linux',
    'Windows',
    'Windows 7,8',
    'Zaštita i sigurnost',
] as const;

export type BookCategory = typeof BOOK_CATEGORIES[number];

export const isValidCategory = (category: string): category is BookCategory => {
    return BOOK_CATEGORIES.includes(category as BookCategory);
};

export const getCategoryOptions = () => {
    return BOOK_CATEGORIES.map(category => ({
        value: category,
        label: category,
    }));
};

export const getCategoriesByLetter = () => {
    const grouped: Record<string, string[]> = {};

    BOOK_CATEGORIES.forEach(category => {
        const firstLetter = category[0].toUpperCase();
        if (!grouped[firstLetter]) {
            grouped[firstLetter] = [];
        }
        grouped[firstLetter].push(category);
    });

    return grouped;
};

export const POPULAR_CATEGORIES = [
    'Mašinsko učenje',
    'C, C++, C#',
    'Algoritmi',
    'Generativna veštačka inteligencija',
    'Veštačka inteligencija',
    'ChatGPT',
    'Blockchain',
    'Računarstvo u oblaku',
    'Web design',
    'JavaScript',
] as const;