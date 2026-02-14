import { useEffect, useState } from "react";
import { MenubarPopover } from "./components/MenubarPopover";
import { Dashboard } from "./components/Dashboard";
import "./App.css";

/**
 * App determines which view to render based on the window type.
 *
 * - Popover window ("/"): Shows the MenubarPopover (small search + list)
 * - Dashboard window ("/dashboard"): Shows the full Dashboard (table view)
 *
 * Since Tauri windows use the same frontend bundle, we use the window label
 * and URL path to determine the appropriate view.
 */
function App() {
    const [view, setView] = useState<"popover" | "dashboard" | "loading">(
        "loading",
    );

    useEffect(() => {
        // Detect window type based on URL path
        const path = window.location.pathname;

        if (path === "/dashboard") {
            setView("dashboard");
        } else {
            // Default to popover for "/" and any other path
            setView("popover");
        }
    }, []);

    // Loading state while we determine the view
    if (view === "loading") {
        return (
            <div className="app-loading">
                <div className="loading-spinner"></div>
            </div>
        );
    }

    // Render the appropriate view
    return (
        <div className={view === "popover" ? "popover-root" : "dashboard-root"}>
            {view === "popover" ? <MenubarPopover /> : <Dashboard />}
        </div>
    );
}

export default App;
