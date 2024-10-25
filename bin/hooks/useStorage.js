'use client';
import { Log } from 'lib/utils/log';
import { useAppDesc } from '../apps';
const log = Log(`useStorage`);
export function useLocalStorage() {
    return useStorage('local');
}
export function useSessionStorage() {
    return useStorage('session');
}
export function getLocalStorage(appKey) {
    return getStorage('local', appKey);
}
export function getSessionStorage(appKey) {
    return getStorage('session', appKey);
}
function useStorage(storageType) {
    const { key } = useAppDesc();
    return getStorage(storageType, key);
}
function getStorage(storageType, appKey) {
    const storage = getStorageByType(storageType);
    return { setItem, getItem, removeItem };
    function getItem(key) {
        if (!storage) {
            log.debug(() => `no storage defined`);
            return null;
        }
        try {
            const val = storage.getItem(`${appKey}-${key}`) ?? null;
            if (val !== null)
                return JSON.parse(val);
        }
        catch (e) {
            log.warn(`getting '${appKey}-${key}': ${e}`);
        }
        return null;
    }
    /** sets an `item` for `key` and returns `true` if successful, `false` if not  */
    function setItem(key, value) {
        if (!storage) {
            log.debug(() => `no storage defined`);
            return false;
        }
        try {
            storage.setItem(`${appKey}-${key}`, JSON.stringify(value));
        }
        catch (e) {
            log.warn(`setting '${appKey}-${key}': ${e}`);
            return false;
        }
        return true;
    }
    function removeItem(key) {
        if (!storage) {
            log.debug(() => `no storage defined`);
            return;
        }
        storage.removeItem(`${appKey}-${key}`);
    }
}
function getStorageByType(storageType) {
    if (typeof localStorage === 'object')
        if (storageType === 'local') {
            return localStorage;
        }
        else if (storageType === 'session') {
            return sessionStorage;
        }
}
