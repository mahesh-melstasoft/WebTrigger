"use client"

import * as React from "react"
import SideDrawer from "./SideDrawer"
import BottomBar from "./BottomBar"

export default function MobileShell({
    children,
}: React.PropsWithChildren<unknown>) {
    return (
        <div className="min-h-screen">
            {/* Side drawer trigger is placed in a visually hidden nav slot for small screens */}
            <div className="fixed left-4 top-4 z-50 md:hidden">
                <SideDrawer>
                    <ul className="flex flex-col gap-2">
                        <li>
                            <a href="/dashboard" className="block rounded-md px-3 py-2 hover:bg-accent">
                                Dashboard
                            </a>
                        </li>
                        <li>
                            <a href="/dashboard/add" className="block rounded-md px-3 py-2 hover:bg-accent">
                                Create Trigger
                            </a>
                        </li>
                        <li>
                            <a href="/docs" className="block rounded-md px-3 py-2 hover:bg-accent">
                                Docs
                            </a>
                        </li>
                        <li>
                            <a href="/settings" className="block rounded-md px-3 py-2 hover:bg-accent">
                                Settings
                            </a>
                        </li>
                    </ul>
                </SideDrawer>
            </div>

            {/* Main content */}
            <main className="pb-20">{children}</main>

            {/* Bottom action bar for mobile only */}
            <div className="md:hidden">
                <BottomBar />
            </div>
        </div>
    )
}
