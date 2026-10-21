import {
    hasParams,
    removeParams,
    isExternalLink,
    removeLastSlash,
} from '../utils';

type IsActiveLinkOptions = {
    pathname: string;
    itemPath: string;
    deep?: boolean;
};

export function useActiveLink({
    pathname: currentPath,
    itemPath,
    deep = true,
}: IsActiveLinkOptions): boolean {
    const pathname = removeLastSlash(currentPath);
    const pathHasParams = hasParams(itemPath);

    const notValid =
        itemPath.startsWith('#') || isExternalLink(itemPath);

    if (notValid) {
        return false;
    }

    const isDeep = deep || pathHasParams;

    if (isDeep) {
        const defaultActive = pathname.includes(itemPath);
        const originItemPath = removeParams(itemPath);
        const hasParamsActive =
            pathHasParams && originItemPath === pathname;


        return defaultActive || hasParamsActive;


    }

    return pathname === itemPath;
}
