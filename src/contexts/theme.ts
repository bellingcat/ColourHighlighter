export interface Theme {
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
  gradients: {
    primary: string;
    secondary: string;
    rainbow: string;
  };
}

export const lightTheme: Theme = {
  colors: {
    background: '#ffffff',
    backgroundSecondary: '#f8fafc',
    backgroundTertiary: '#f1f5f9',
    
    text: '#1e293b',
    textSecondary: '#475569',
    textMuted: '#64748b',
    
    primary: '#3241e2',
    primaryHover: '#5855eb',
    primaryText: '#ffffff',
    
    accent: '#06b6d4',
    accentHover: '#0891b2',
    
    border: '#e2e8f0',
    shadow: 'rgba(0, 0, 0, 0.1)',
    overlay: 'rgba(0, 0, 0, 0.5)',
    
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },
  shadows: {
    small: '0 1px 3px rgba(0, 0, 0, 0.1)',
    medium: '0 4px 16px rgba(0, 0, 0, 0.12)',
    large: '0 8px 32px rgba(0, 0, 0, 0.16)',
    glow: '0 0 20px rgba(99, 102, 241, 0.3)',
  },
  gradients: {
    primary: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
    secondary: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
    rainbow: 'linear-gradient(90deg, #ff6ec4, #7873f5, #4ade80, #facc15, #fb923c, #f43f5e)',
  },
};

export const darkTheme: Theme = {
  colors: {
    background: '#0f172a',
    backgroundSecondary: '#1e293b',
    backgroundTertiary: '#334155',
    
    text: '#f8fafc',
    textSecondary: '#e2e8f0',
    textMuted: '#94a3b8',
    
    primary: '#6366f1',
    primaryHover: '#7c3aed',
    primaryText: '#ffffff',
    
    accent: '#06b6d4',
    accentHover: '#0891b2',
    
    border: '#334155',
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
    glow: '0 0 20px rgba(99, 102, 241, 0.4)',
  },
  gradients: {
    primary: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
    secondary: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
    rainbow: 'linear-gradient(90deg, #ff6ec4, #7873f5, #4ade80, #facc15, #fb923c, #f43f5e)',
  },
};
