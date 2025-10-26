"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"

// Minimal type for the beforeinstallprompt event used by browsers.
interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform?: string }>
}

export default function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = React.useState<BeforeInstallPromptEvent | null>(null)
    const [visible, setVisible] = React.useState(false)
    const [isFirefox, setIsFirefox] = React.useState(false)

    React.useEffect(() => {
        // Detect Firefox
        const isFirefoxBrowser = navigator.userAgent.toLowerCase().includes('firefox');
        setIsFirefox(isFirefoxBrowser);

        function handler(e: Event) {
            const beh = e as BeforeInstallPromptEvent
            e.preventDefault()
            setDeferredPrompt(beh)
            setVisible(true)
        }

        // Firefox doesn't support beforeinstallprompt event
        // We'll show install instructions for Firefox instead
        if (!isFirefoxBrowser) {
            window.addEventListener('beforeinstallprompt', handler)
        } else {
            // For Firefox, show install prompt after a delay if PWA criteria are met
            const timer = setTimeout(() => {
                // Check if we're in standalone mode (already installed)
                if (!window.matchMedia('(display-mode: standalone)').matches) {
                    setVisible(true);
                }
            }, 3000); // Show after 3 seconds

            return () => clearTimeout(timer);
        }

        return () => {
            if (!isFirefoxBrowser) {
                window.removeEventListener('beforeinstallprompt', handler)
            }
        }
    }, [])

    async function handleInstall() {
        if (!deferredPrompt) return
        await deferredPrompt.prompt()
        const choiceResult = await deferredPrompt.userChoice
        setVisible(false)
        setDeferredPrompt(null)
        console.log('Install prompt result:', choiceResult)
    }

    const handleFirefoxInstall = () => {
        // For Firefox, we can't programmatically install, so we'll hide the prompt
        // and let users know they can manually install
        setVisible(false)
        alert('To install WebTrigger in Firefox:\n\n1. Click the menu button (☰) in the top right\n2. Select "Install This Site as an App"\n3. Click "Install" in the dialog')
    }

    if (!visible) return null

    if (isFirefox) {
        return (
            <div className="fixed bottom-20 left-4 right-4 z-50 rounded-lg border bg-popover p-3 shadow-md md:hidden">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="text-sm font-medium">Install WebTrigger</div>
                        <div className="text-xs text-muted-foreground">Add to your home screen for quick access.</div>
                    </div>
                    <div className="ml-4 flex gap-2">
                        <Button variant="default" size="sm" onClick={handleFirefoxInstall}>How to Install</Button>
                        <Button variant="ghost" size="sm" onClick={() => setVisible(false)}>Dismiss</Button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="fixed bottom-20 left-4 right-4 z-50 rounded-lg border bg-popover p-3 shadow-md md:hidden">
            <div className="flex items-center justify-between">
                <div>
                    <div className="text-sm font-medium">Install WebTrigger</div>
                    <div className="text-xs text-muted-foreground">Add to your home screen for quick access.</div>
                </div>
                <div className="ml-4 flex gap-2">
                    <Button variant="default" size="sm" onClick={handleInstall}>Install</Button>
                    <Button variant="ghost" size="sm" onClick={() => setVisible(false)}>Dismiss</Button>
                </div>
            </div>
        </div>
    )
}
