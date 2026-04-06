export const formatTime = (dateStr: string) => {
    if (!dateStr) return '';
    try {
        const date = new Date(dateStr);
        return new Intl.DateTimeFormat('en-GB', {
            hour: 'numeric',
            minute: 'numeric',
            month: 'short',
            day: 'numeric'
        }).format(date);
    } catch {
        return dateStr;
    }
};
