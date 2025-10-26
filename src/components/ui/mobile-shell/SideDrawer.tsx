"use client"

import * as React from "react"
import * as Dialog from "@radix-ui/react-dialog"
import { Menu as MenuIcon, X as XIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export default function SideDrawer({
    children,
    className,
}: React.PropsWithChildren<{ className?: string }>) {
    return (
        <Dialog.Root>
            <Dialog.Trigger asChild>
                <Button variant="ghost" size="icon" aria-label="Open menu">
                    <MenuIcon />
                </Button>
            </Dialog.Trigger>

            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40 data-[state=open]:animate-in data-[state=closed]:animate-out" />
                <Dialog.Content
                    className={cn(
                        "fixed left-0 top-0 z-50 h-full w-[92vw] max-w-xs bg-background p-4 shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out",
                        className
                    )}
                >
                    <div className="flex items-center justify-between">
                        <div className="text-lg font-semibold">Menu</div>
                        <Dialog.Close asChild>
                            <Button variant="ghost" size="icon" aria-label="Close menu">
                                <XIcon />
                            </Button>
                        </Dialog.Close>
                    </div>

                    <div className="mt-4">{children}</div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    )
}
