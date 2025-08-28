'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Webhook,
  Zap,
  Shield,
  BarChart3,
  Clock,
  Globe,
  CheckCircle,
  ArrowRight,
  Star,
  Users,
  Activity,
  Lock,
  Smartphone,
  Settings,
  FileText,
  Crown,
  Sparkles
} from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    if (token) {
      router.push('/dashboard');
    }
  }, [router]);

  const features = [
    {
      icon: Webhook,
      title: "Webhook Management",
      description: "Create and manage webhook endpoints with custom callback URLs. Perfect for integrating with APIs, services, and applications."
    },
    {
      icon: Zap,
      title: "Instant Triggers",
      description: "Generate unique trigger URLs that can be called from anywhere. Execute your webhooks on-demand with simple HTTP requests."
    },
    {
      icon: Clock,
      title: "Timeout Control",
      description: "Set custom timeout durations for your webhook calls. Prevent hanging requests and ensure reliable execution."
    },
    {
      icon: BarChart3,
      title: "Comprehensive Logging",
      description: "Track every webhook execution with detailed logs. Monitor performance, debug issues, and maintain audit trails."
    },
    {
      icon: Shield,
      title: "Secure Authentication",
      description: "Optional two-factor authentication with Google Authenticator. Keep your webhook endpoints secure and protected."
    },
    {
      icon: Settings,
      title: "Flexible Configuration",
      description: "Customize webhook behavior with timeout settings, active/inactive status, and personalized branding options."
    }
  ];

  const benefits = [
    {
      title: "Developer-Friendly",
      description: "Simple API endpoints that integrate seamlessly with your existing workflows and applications."
    },
    {
      title: "Reliable & Scalable",
      description: "Built on robust infrastructure with PostgreSQL database and optimized for high-performance webhook delivery."
    },
    {
      title: "Cost-Effective",
      description: "Start free and scale as you grow. Multiple subscription tiers to match your usage and budget."
    },
    {
      title: "Real-Time Monitoring",
      description: "Get instant visibility into your webhook performance with detailed execution logs and status tracking."
    }
  ];

  const pricing = [
    {
      name: "Free",
      price: "$0",
      period: "/month",
      description: "Perfect for getting started",
      features: [
        "5 webhook triggers",
        "Basic logging",
        "Community support",
        "30-second timeout"
      ],
      popular: false,
      icon: Users
    },
    {
      name: "Starter",
      price: "$9",
      period: "/month",
      description: "Great for growing projects",
      features: [
        "50 webhook triggers",
        "Enhanced logging",
        "Email support",
        "Custom timeouts",
        "Priority execution"
      ],
      popular: true,
      icon: Zap
    },
    {
      name: "Pro",
      price: "$29",
      period: "/month",
      description: "For serious applications",
      features: [
        "500 webhook triggers",
        "Advanced analytics",
        "Priority support",
        "Custom integrations",
        "White-label options",
        "API rate limiting"
      ],
      popular: false,
      icon: Star
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <Webhook className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">WebTrigger</span>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" asChild>
                <Link href="/login">Sign In</Link>
              </Button>
              <Button asChild>
                <Link href="/signup">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Badge className="mb-4 bg-blue-100 text-blue-800 hover:bg-blue-100">
              <Sparkles className="h-3 w-3 mr-1" />
              Smart Webhook Management Made Simple
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Trigger Webhooks
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                {" "}Anywhere, Anytime
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Create, manage, and trigger webhook endpoints with ease. Perfect for developers who need
              reliable webhook management with comprehensive logging and security features.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="text-lg px-8 py-3" asChild>
                <Link href="/signup">
                  Start Free Today
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-3" asChild>
                <Link href="/login">Sign In</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Background decoration */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 opacity-20 blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 opacity-20 blur-3xl"></div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Powerful Features for Modern Webhooks
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to manage webhooks efficiently and securely
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                  <CardHeader>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                      <Icon className="h-6 w-6 text-blue-600" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-gray-600">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose WebTrigger?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Built for developers who need reliable, secure, and easy-to-use webhook management
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{benefit.title}</h3>
                  <p className="text-gray-600">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Start free and scale as your needs grow
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricing.map((plan, index) => {
              const Icon = plan.icon;
              return (
                <Card key={index} className={`relative ${plan.popular ? 'border-blue-500 shadow-xl scale-105' : 'border-gray-200'}`}>
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-blue-500 text-white px-4 py-1">Most Popular</Badge>
                    </div>
                  )}
                  <CardHeader className="text-center pb-8">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <Icon className="h-6 w-6 text-blue-600" />
                    </div>
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <div className="mt-4">
                      <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                      <span className="text-gray-600">{plan.period}</span>
                    </div>
                    <CardDescription className="mt-2">{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center space-x-3">
                          <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                          <span className="text-gray-600">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      className={`w-full mt-8 ${plan.popular ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                      variant={plan.popular ? 'default' : 'outline'}
                      asChild
                    >
                      <Link href="/signup">
                        {plan.name === 'Free' ? 'Get Started Free' : 'Choose Plan'}
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of developers who trust WebTrigger for their webhook management needs
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-3" asChild>
              <Link href="/signup">
                Create Free Account
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-3 border-white text-white hover:bg-white hover:text-blue-600" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Webhook className="h-6 w-6 text-blue-400" />
                <span className="text-xl font-bold">WebTrigger</span>
              </div>
              <p className="text-gray-400">
                Smart webhook management made simple. Create, trigger, and monitor your webhooks with ease.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/dashboard" className="hover:text-white">Dashboard</Link></li>
                <li><Link href="/settings" className="hover:text-white">Settings</Link></li>
                <li><Link href="/login" className="hover:text-white">Login</Link></li>
                <li><Link href="/signup" className="hover:text-white">Sign Up</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Features</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Webhook Management</li>
                <li>Trigger URLs</li>
                <li>Logging & Analytics</li>
                <li>Two-Factor Auth</li>
                <li>Custom Timeouts</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Documentation</li>
                <li>API Reference</li>
                <li>Community</li>
                <li>Contact Us</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 WebTrigger. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
