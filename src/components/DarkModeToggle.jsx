import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

const DarkModeToggleComponent = () => {
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

export const DarkModeToggle = React.memo(DarkModeToggleComponent);