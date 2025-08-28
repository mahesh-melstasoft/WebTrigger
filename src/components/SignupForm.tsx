'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Mail, Lock, Smartphone, Shield } from 'lucide-react';

export default function SignupForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [enable2FA, setEnable2FA] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const [userId, setUserId] = useState('');
    const [totpToken, setTotpToken] = useState('');
    const [verifying, setVerifying] = useState(false);
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, enable2FA }),
            });

            const data = await response.json();

            if (response.ok) {
                if (data.requiresVerification) {
                    setQrCodeUrl(data.qrCodeUrl);
                    setUserId(data.userId);
                    setTwoFactorEnabled(true);
                } else {
                    // No 2FA setup required, redirect to login
                    router.push('/login?message=Account created successfully! You can now log in.');
                }
            } else {
                setError(data.error);
            }
        } catch {
            setError('An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleTotpVerification = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!totpToken || !userId) return;

        setVerifying(true);
        setError('');

        try {
            const response = await fetch('/api/auth/signup/complete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, token: totpToken }),
            });

            const data = await response.json();

            if (response.ok) {
                // Success - redirect to login
                router.push('/login?message=Account setup completed successfully! You can now log in.');
            } else {
                setError(data.error);
            }
        } catch {
            setError('An error occurred while verifying TOTP token');
        } finally {
            setVerifying(false);
        }
    };

    if (qrCodeUrl && twoFactorEnabled) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
                <Card className="w-full max-w-md">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl text-center flex items-center justify-center gap-2">
                            <Smartphone className="h-6 w-6" />
                            Complete Account Setup
                        </CardTitle>
                        <CardDescription className="text-center">
                            Scan this QR code with your authenticator app and enter the verification code
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex justify-center">
                            <div className="bg-white p-4 rounded-lg shadow-sm border">
                                <img
                                    src={qrCodeUrl}
                                    alt="TOTP QR Code"
                                    className="w-48 h-48"
                                    style={{ maxWidth: '192px', height: 'auto' }}
                                />
                            </div>
                        </div>

                        <form onSubmit={handleTotpVerification} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="totpToken">TOTP Verification Code</Label>
                                <div className="relative">
                                    <Smartphone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="totpToken"
                                        type="text"
                                        placeholder="Enter 6-digit code from your authenticator app"
                                        value={totpToken}
                                        onChange={(e) => setTotpToken(e.target.value)}
                                        className="pl-10 text-center text-lg font-mono"
                                        maxLength={6}
                                        required
                                    />
                                </div>
                            </div>

                            {error && (
                                <Alert variant="destructive">
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            <Button type="submit" className="w-full" disabled={verifying || totpToken.length !== 6}>
                                {verifying ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Verifying...
                                    </>
                                ) : (
                                    'Complete Setup'
                                )}
                            </Button>
                        </form>

                        <Alert>
                            <Smartphone className="h-4 w-4" />
                            <AlertDescription>
                                Scan the QR code with your authenticator app (Google Authenticator, Authy, etc.) and enter the 6-digit code above to complete your account setup.
                            </AlertDescription>
                        </Alert>
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
                        Enter your details to create your account
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

                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="enable2FA"
                                checked={enable2FA}
                                onCheckedChange={(checked) => setEnable2FA(checked as boolean)}
                            />
                            <Label htmlFor="enable2FA" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2">
                                <Shield className="h-4 w-4" />
                                Enable Two-Factor Authentication (2FA)
                            </Label>
                        </div>

                        {enable2FA && (
                            <Alert>
                                <Shield className="h-4 w-4" />
                                <AlertDescription>
                                    You'll need to scan a QR code with an authenticator app (Google Authenticator, Authy, etc.) after creating your account.
                                </AlertDescription>
                            </Alert>
                        )}

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
