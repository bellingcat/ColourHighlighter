export interface Theme {
  mode: 'light' | 'dark';
  colors: {
    // Background colors
    background: string;
    backgroundSecondary: string;
    backgroundTertiary: string;
    
    // Text colors
    text: string;
    textSecondary: string;
    textMuted: string;
    
    // Primary colors
    primary: string;
    primaryHover: string;
    primaryText: string;
    
    // Accent colors
    accent: string;
    accentHover: string;
    
    // UI colors
    border: string;
    shadow: string;
    overlay: string;
    
    // Status colors
    success: string;
    warning: string;
    error: string;
    info: string;
  };
  shadows: {
    small: string;
    medium: string;
    large: string;
    glow: string;
  };
}

export const lightTheme: Theme = {
  mode: 'light',
  colors: {
    background: '#ffffff',
    backgroundSecondary: '#ddd',
    backgroundTertiary: '#ddd',
    
    text: '#1a1918',
    textSecondary: '#2e2e2e',
    textMuted: '#6a6a6a',
    
    primary: '#fbb400',
    primaryHover: '#fbb400',
    primaryText: '#000',
    
    accent: '#f88906',
    accentHover: '#f88906',
    
    border: '#e2e8f0',
    shadow: 'rgba(0, 0, 0, 0.1)',
    overlay: 'rgba(0, 0, 0, 0.5)',
    
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },
  shadows: {
    small: '0 1px 3px rgba(0, 0, 0, 0.3)',
    medium: '0 4px 16px rgba(0, 0, 0, 0.25)',
    large: '0 8px 32px rgba(0, 0, 0, 0.4)',
    glow: '0 0 20px #ffd15baa',
  },
};

export const darkTheme: Theme = {
  mode: 'dark',
  colors: {
    background: '#1a1918',
    backgroundSecondary: '#2e2e2e',
    backgroundTertiary: '#000',
    
    text: '#fff',
    textSecondary: '#fff',
    textMuted: '#bbb',
    
    primary: '#fbb400',
    primaryHover: '#fbb400',
    primaryText: '#000',
    
    accent: '#f88906',
    accentHover: '#f88906',
    
    border: '#6a6a6a',
    shadow: 'rgba(0, 0, 0, 0.3)',
    overlay: 'rgba(0, 0, 0, 0.7)',
    
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },
  shadows: {
    small: '0 1px 3px rgba(0, 0, 0, 0.3)',
    medium: '0 4px 16px rgba(0, 0, 0, 0.25)',
    large: '0 8px 32px rgba(0, 0, 0, 0.4)',
    glow: '0 0 20px #ffd15baa',
  },
};
