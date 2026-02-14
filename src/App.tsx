import { useEffect, useState } from "react";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { MenubarPopover } from "./components/MenubarPopover";

function App() {
    const [windowLabel, setWindowLabel] = useState<string | null>(null);

    useEffect(() => {
        const window = getCurrentWebviewWindow();
        setWindowLabel(window.label);
    }, []);

    // Show popover for the popover window, placeholder for main window
    if (windowLabel === "popover") {
        return <MenubarPopover />;
    }

    // Main dashboard window - placeholder for now (Plan 03 implements this)
    return (
        <div
            style={{
                padding: 20,
                color: "#e0e0e0",
                background: "#1e1e1e",
                height: "100vh",
            }}
        >
            <h1>Anchor Dashboard</h1>
            <p>Dashboard implementation coming in Plan 03.</p>
        </div>
    );
}

export default App;
