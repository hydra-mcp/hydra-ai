import { Outlet } from 'react-router-dom';
import { NavBar } from '@/components/NavBar';
import { useTheme } from '@/hooks/use-theme';
import { useState } from 'react';

export function AppLayout() {
    const { isDarkMode, toggleTheme } = useTheme();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    return (
        <div className="bg-background text-foreground min-h-screen">
            <NavBar
                isDarkMode={isDarkMode}
                toggleTheme={toggleTheme}
                isSidebarOpen={isSidebarOpen}
                toggleSidebar={toggleSidebar}
            />
            <div className="h-full">
                <Outlet context={{ isSidebarOpen, toggleSidebar }} />
            </div>
        </div>
    );
} 