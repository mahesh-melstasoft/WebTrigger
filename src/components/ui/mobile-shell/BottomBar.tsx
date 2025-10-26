"use client"

import * as React from "react"
import Link from "next/link"
import CreateTriggerDialog from "./CreateTriggerDialog"
import { Home, ListChecks, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function BottomBar({ className }: { className?: string }) {
    return (
        <nav
            aria-label="Mobile actions"
            className={`fixed inset-x-0 bottom-0 z-50 mx-auto max-w-screen-lg border-t bg-background/90 backdrop-blur-sm px-4 py-2 ${className || ""}`}
        >
            <div className="mx-auto flex max-w-lg items-center justify-between">
                <Link href="/" aria-label="Home">
                    <Button variant="ghost" size="icon">
                        <Home />
                    </Button>
                </Link>

                <Link href="/dashboard" aria-label="Triggers">
                    <Button variant="ghost" size="icon">
                        <ListChecks />
                    </Button>
                </Link>

                {/* FAB: animated central create button that opens a dialog */}
                <div className="relative -mt-6">
                    <div className="rounded-full shadow-lg">
                        <CreateTriggerDialog />
                    </div>
                </div>

                <Link href="/settings" aria-label="Settings">
                    <Button variant="ghost" size="icon">
                        <Settings />
                    </Button>
                </Link>
            </div>
            <style jsx>{`
        @keyframes pulse-slow {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        .animate-pulse-slow { animation: pulse-slow 1.8s infinite ease-in-out; }
      `}</style>
        </nav>
    )
}
