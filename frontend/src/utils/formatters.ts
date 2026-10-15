export const formatGenreLabel = (genre: string): string => {
    if (!genre) return '';
    if (genre === 'SCI_FI') return 'Sci-Fi';
    return genre
        .toLowerCase()
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

export const toLocalDate = (value: string): Date => {
    const [year, month, day] = value.slice(0, 10).split('-').map(Number);
    return new Date(year, month - 1, day);
};

export const formatDate = (value: string): string => {
    if (!value) return '';
    return new Intl.DateTimeFormat(navigator.language).format(toLocalDate(value));
};

export const toApiDate = (date: Date = new Date()): string => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`; // dd-MM-yyyy expected by backend
};
