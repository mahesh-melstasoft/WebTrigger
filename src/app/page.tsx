'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Webhook } from 'lucide-react';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <Webhook className="h-12 w-12 text-blue-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Callback Manager
              </h1>
              <p className="text-gray-600 mt-2">Redirecting you to the right place...</p>
            </div>
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-500" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
