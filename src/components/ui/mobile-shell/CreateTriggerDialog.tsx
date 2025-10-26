"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogTitle,
    DialogDescription,
    DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PlusCircle } from "lucide-react"

export default function CreateTriggerDialog() {
    const router = useRouter()
    const [name, setName] = React.useState("")
    const [url, setUrl] = React.useState("")

    function handleQuickCreate(e: React.FormEvent) {
        e.preventDefault()
            ; (async () => {
                try {
                    const res = await fetch('/api/triggers', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name, callbackUrl: url }),
                    })

                    const data = await res.json()
                    if (res.ok && data.id) {
                        // Navigate to the edit page for the newly created callback
                        router.push(`/dashboard/edit/${data.id}`)
                    } else {
                        // fallback to the full editor create page
                        router.push(`/dashboard/add?name=${encodeURIComponent(name)}&url=${encodeURIComponent(url)}`)
                    }
                } catch (err) {
                    console.error(err)
                    router.push(`/dashboard/add?name=${encodeURIComponent(name)}&url=${encodeURIComponent(url)}`)
                }
            })()
    }

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="default" size="icon" aria-label="Create">
                    <PlusCircle />
                </Button>
            </DialogTrigger>

            <DialogContent>
                <DialogTitle>Create Trigger</DialogTitle>
                <DialogDescription>
                    Quick create a trigger or continue to the full editor.
                </DialogDescription>

                <form className="mt-4 grid gap-3" onSubmit={handleQuickCreate}>
                    <label className="flex flex-col text-sm">
                        <span className="mb-1 text-muted-foreground">Name</span>
                        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="My trigger" />
                    </label>

                    <label className="flex flex-col text-sm">
                        <span className="mb-1 text-muted-foreground">Callback URL</span>
                        <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com/hook" />
                    </label>

                    <div className="mt-4 flex items-center gap-2">
                        <Button type="submit">Create</Button>
                        <DialogClose asChild>
                            <Button variant="ghost">Cancel</Button>
                        </DialogClose>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
