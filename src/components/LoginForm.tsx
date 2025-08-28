'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, Lock, Shield } from 'lucide-react';

export default function LoginForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [token, setToken] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showTotpField, setShowTotpField] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const message = searchParams.get('message');
        if (message) {
            setError(''); // Clear any existing error
            // You could show a success message here if needed
        }
    }, [searchParams]);

    const handleInitialSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // First, try to login without TOTP to check if user has 2FA
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                // Login successful without TOTP - user doesn't have 2FA
                localStorage.setItem('token', data.token);
                router.push('/dashboard');
            } else if (data.error === 'TOTP token is required for accounts with 2FA enabled') {
                // User has 2FA enabled, show TOTP field
                setShowTotpField(true);
                setError(''); // Clear error
            } else {
                setError(data.error || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            setError('Network error. Please check your connection and try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleTotpSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) return;

        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, token }),
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('token', data.token);
                router.push('/dashboard');
            } else {
                setError(data.error || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            setError('Network error. Please check your connection and try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleBackToCredentials = () => {
        setShowTotpField(false);
        setToken('');
        setError('');
    };

    if (showTotpField) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
                <Card className="w-full max-w-md">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl text-center flex items-center justify-center gap-2">
                            <Shield className="h-6 w-6" />
                            Two-Factor Authentication
                        </CardTitle>
                        <CardDescription className="text-center">
                            Enter your 6-digit code from your authenticator app
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleTotpSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="token">TOTP Token</Label>
                                <div className="relative">
                                    <Shield className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="token"
                                        type="text"
                                        placeholder="Enter your 6-digit TOTP token"
                                        value={token}
                                        onChange={(e) => setToken(e.target.value)}
                                        className="pl-10 text-center text-lg font-mono"
                                        maxLength={6}
                                        required
                                        autoFocus
                                    />
                                </div>
                            </div>

                            {error && (
                                <Alert variant="destructive">
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            <div className="space-y-2">
                                <Button type="submit" className="w-full" disabled={loading || token.length !== 6}>
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Verifying...
                                        </>
                                    ) : (
                                        'Verify & Sign In'
                                    )}
                                </Button>

                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full"
                                    onClick={handleBackToCredentials}
                                    disabled={loading}
                                >
                                    Back to Credentials
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl text-center">Welcome back</CardTitle>
                    <CardDescription className="text-center">
                        Enter your credentials to access your account
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {searchParams.get('message') && (
                        <Alert className="mb-4">
                            <AlertDescription>{searchParams.get('message')}</AlertDescription>
                        </Alert>
                    )}

                    <form onSubmit={handleInitialSubmit} className="space-y-4">
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
                                    Signing in...
                                </>
                            ) : (
                                'Sign in'
                            )}
                        </Button>
                    </form>

                    <div className="mt-6 text-center text-sm">
                        <span className="text-gray-600">Don&apos;t have an account? </span>
                        <Button variant="link" className="p-0 h-auto font-normal" asChild>
                            <a href="/signup">Sign up</a>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
