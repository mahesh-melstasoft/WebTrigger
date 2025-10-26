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

    React.useEffect(() => {
        function handler(e: Event) {
            const beh = e as BeforeInstallPromptEvent
            e.preventDefault()
            setDeferredPrompt(beh)
            setVisible(true)
        }

        window.addEventListener('beforeinstallprompt', handler)
        return () => window.removeEventListener('beforeinstallprompt', handler)
    }, [])

    async function handleInstall() {
        if (!deferredPrompt) return
        await deferredPrompt.prompt()
        const choiceResult = await deferredPrompt.userChoice
        setVisible(false)
        setDeferredPrompt(null)
        console.log('Install prompt result:', choiceResult)
    }

    if (!visible) return null

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
