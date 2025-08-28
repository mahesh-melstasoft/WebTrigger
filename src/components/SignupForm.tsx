'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, Lock, Smartphone } from 'lucide-react';

export default function SignupForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                setQrCodeUrl(data.qrCodeUrl);
            } else {
                setError(data.error);
            }
        } catch {
            setError('An error occurred');
        } finally {
            setLoading(false);
        }
    };

    if (qrCodeUrl) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
                <Card className="w-full max-w-md">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl text-center flex items-center justify-center gap-2">
                            <Smartphone className="h-6 w-6" />
                            Setup Complete
                        </CardTitle>
                        <CardDescription className="text-center">
                            Scan this QR code with your authenticator app to complete setup
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex justify-center">
                            <div className="bg-white p-4 rounded-lg shadow-sm border">
                                {qrCodeUrl ? (
                                    <img
                                        src={qrCodeUrl}
                                        alt="TOTP QR Code"
                                        className="w-48 h-48"
                                        style={{ maxWidth: '192px', height: 'auto' }}
                                    />
                                ) : (
                                    <div className="w-48 h-48 bg-gray-100 flex items-center justify-center">
                                        <Smartphone className="h-16 w-16 text-gray-400" />
                                    </div>
                                )}
                            </div>
                        </div>

                        <Alert>
                            <Smartphone className="h-4 w-4" />
                            <AlertDescription>
                                After scanning the QR code, use the generated TOTP token to log in to your account.
                            </AlertDescription>
                        </Alert>

                        <Button onClick={() => router.push('/login')} className="w-full">
                            Continue to Login
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl text-center">Create account</CardTitle>
                    <CardDescription className="text-center">
                        Enter your details to create your account and set up 2FA
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="pl-10"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pl-10"
                                    required
                                />
                            </div>
                        </div>

                        {error && (
                            <Alert variant="destructive">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating account...
                                </>
                            ) : (
                                'Create account'
                            )}
                        </Button>
                    </form>

                    <div className="mt-6 text-center text-sm">
                        <span className="text-gray-600">Already have an account? </span>
                        <Button variant="link" className="p-0 h-auto font-normal" asChild>
                            <a href="/login">Sign in</a>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
