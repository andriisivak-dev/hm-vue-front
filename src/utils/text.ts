let htmlEntityDecoder: HTMLTextAreaElement | null = null;

const getHtmlEntityDecoder = () => {
    if (typeof document === 'undefined') return null;
    if (!htmlEntityDecoder) {
        htmlEntityDecoder = document.createElement('textarea');
    }
    return htmlEntityDecoder;
};

export const decodeHtmlEntities = (value?: string | null) => {
    if (!value) return '';
    const decoder = getHtmlEntityDecoder();
    if (!decoder) return value;
    decoder.innerHTML = value;
    return decoder.value || value;
};

export const decodeTextOrDash = (value?: string | null) => decodeHtmlEntities(value) || '—';

export const formatLocation = (city?: string | null, state?: string | null) => {
    const cityValue = decodeHtmlEntities(city).trim();
    const stateValue = decodeHtmlEntities(state).trim();
    if (!cityValue && !stateValue) return '—';
    if (cityValue && stateValue) return `${cityValue}, ${stateValue}`;
    return cityValue || stateValue;
};
