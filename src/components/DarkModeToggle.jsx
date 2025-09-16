import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

export const DarkModeToggle = () => {
    const { isDarkMode, toggleDarkMode } = useTheme();

    return (
        <button
            className="dark-mode-toggle"
            onClick={toggleDarkMode}
            title={isDarkMode ? "라이트 모드로 전환" : "다크 모드로 전환"}
        >
            {isDarkMode ? "☀️" : "🌙"}
        </button>
    );
};