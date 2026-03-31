/**
 * hooks/useLocalStorage.js
 * useState that persists its value to localStorage automatically.
 *
 * Usage:
 *   const [theme, setTheme] = useLocalStorage("theme", "light");
 */

import { useState, useEffect } from "react";

const useLocalStorage = (key, initialValue) => {
    const [storedValue, setStoredValue] = useState(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch {
            return initialValue;
        }
    });

    const setValue = (value) => {
        try {
            const valueToStore =
                value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) {
            console.warn(`[useLocalStorage] Could not set key "${key}":`, error);
        }
    };

    const removeValue = () => {
        try {
            window.localStorage.removeItem(key);
            setStoredValue(initialValue);
        } catch (error) {
            console.warn(`[useLocalStorage] Could not remove key "${key}":`, error);
        }
    };

    return [storedValue, setValue, removeValue];
};

export default useLocalStorage;