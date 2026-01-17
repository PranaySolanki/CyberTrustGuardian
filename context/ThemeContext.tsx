import React, { createContext, useContext, useState } from 'react';

export const MidnightGuardianPalette = {
    background: '#0B1015', // Teal-tinted dark
    surface: '#161D26',
    surfaceLighter: '#1F2A35',
    accent: '#00F2FE', // Bright Cyan
    accentDesaturated: '#20C997', // Teal
    textPrimary: '#CBD5E1',
    textSecondary: '#64748B',
    border: '#1E293B',
    success: '#20C997',
    successDark: '#083344',
    danger: '#FF7E5F', // Coral
    warning: '#FFCE20',
    purple: '#8F7CEB',
    glass: 'rgba(22, 29, 38, 0.8)',
    glassBorder: 'rgba(255, 255, 255, 0.1)',
};

export const LightPalette = {
    background: '#F1F4F9',
    surface: '#FFFFFF',
    surfaceLighter: '#F8FAFC',
    accent: '#047857', // Forest Green
    accentDesaturated: '#059669',
    textPrimary: '#1E293B',
    textSecondary: '#64748B',
    border: '#E2E8F0',
    success: '#20C997',
    successDark: '#DCFCE7',
    danger: '#EF4444',
    warning: '#F59E0B',
    purple: '#7C3AED',
    glass: 'rgba(255, 255, 255, 0.8)',
    glassBorder: 'rgba(0, 0, 0, 0.05)',
};

type ThemeContextType = {
    isDarkMode: boolean;
    colors: typeof MidnightGuardianPalette;
    toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isDarkMode, setIsDarkMode] = useState(true); // Default to Dark as per user request

    const colors = isDarkMode ? MidnightGuardianPalette : LightPalette;

    const toggleTheme = () => {
        setIsDarkMode(prev => !prev);
    };

    return (
        <ThemeContext.Provider value={{ isDarkMode, colors, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
