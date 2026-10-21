export const hasParams = (url: string): boolean => {
    const queryString = url.split('?')[1];

    return queryString
        ? new URLSearchParams(queryString).toString().length > 0
        : false;
};

// ----------------------------------------------------------------------

export function removeLastSlash(pathname: string): string {
    if (pathname !== '/' && pathname.endsWith('/')) {
        return pathname.slice(0, -1);
    }

    return pathname;
}

// ----------------------------------------------------------------------

export function removeParams(url: string): string {
    try {
        // Relative paths and absolute URLs both supported
        const urlObj = new URL(url, 'http://localhost');


        return removeLastSlash(urlObj.pathname);


    } catch {
        return url;
    }
}

// ----------------------------------------------------------------------

export function isExternalLink(url: string): boolean {
    return url.startsWith('http');
}
