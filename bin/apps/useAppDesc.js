'use client';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { useAppsContext } from './useAppsContext';
/** returns the app descriptor that matches the current filePath */
export function useAppDesc() {
    const { apps } = useAppsContext();
    const path = usePathname();
    const desc = useRef(getDesc(apps, path));
    useEffect(() => {
        desc.current = getDesc(apps, path);
    }, [apps, path]);
    return desc.current;
}
function getDesc(apps, path) {
    const appKey = path?.split('/')[1];
    return apps.find(desc => desc.key === appKey) ?? { key: appKey, title: '', desc: '', color: '' };
}
