'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Webhook,
  Zap,
  Shield,
  BarChart3,
  Clock,
  CheckCircle,
  ArrowRight,
  Star,
  Users,
  Settings,
  Sparkles,
  Check
} from 'lucide-react';

export default function LandingPage() {
  // Removed unused router

  useEffect(() => {
    // No longer redirecting to dashboard - users can access homepage freely
  }, []);

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
      icon: Users,
      cta: "Get Started"
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
      icon: Zap,
      cta: "Start Free Trial"
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
      icon: Star,
      cta: "Upgrade to Pro"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Light Background */}
      <div className="fixed inset-0 -z-10">
        {/* Light gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50"></div>

        {/* Subtle light orbs */}
        <div className="absolute top-20 left-10 w-96 h-96 bg-gradient-to-br from-blue-200 via-purple-200 to-pink-200 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute top-40 right-20 w-80 h-80 bg-gradient-to-br from-purple-200 via-pink-200 to-rose-200 rounded-full opacity-15 blur-2xl"></div>
        <div className="absolute bottom-32 left-1/4 w-72 h-72 bg-gradient-to-br from-blue-200 via-indigo-200 to-purple-200 rounded-full opacity-10 blur-3xl"></div>
        <div className="absolute bottom-20 right-1/3 w-80 h-80 bg-gradient-to-br from-indigo-200 via-purple-200 to-pink-200 rounded-full opacity-12 blur-3xl"></div>

        {/* Additional floating light elements */}
        <div className="absolute top-1/4 left-1/2 w-32 h-32 bg-gradient-to-br from-emerald-200 to-cyan-200 rounded-full opacity-25 blur-xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-gradient-to-br from-violet-200 to-purple-200 rounded-full opacity-20 blur-2xl"></div>

        {/* Light geometric shapes */}
        <div className="absolute top-16 left-1/3 w-4 h-4 bg-blue-300 rounded-full opacity-60"></div>
        <div className="absolute top-32 right-1/4 w-3 h-3 bg-pink-300 rounded-full opacity-70"></div>
        <div className="absolute bottom-40 left-16 w-5 h-5 bg-purple-300 rounded-full opacity-50"></div>
        <div className="absolute top-2/3 right-16 w-4 h-4 bg-indigo-300 rounded-full opacity-65"></div>
        <div className="absolute top-1/2 left-1/4 w-2 h-2 bg-emerald-300 rounded-full opacity-75"></div>
      </div>
      <nav className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Webhook className="h-8 w-8 text-blue-600" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                WebTrigger
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" className="text-gray-700 hover:text-blue-600 hover:bg-blue-50" asChild>
                <Link href="/login">Sign In</Link>
              </Button>
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0" asChild>
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
            <Badge className="mb-6 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 border-blue-200">
              <Sparkles className="h-3 w-3 mr-1 text-blue-600" />
              Smart Webhook Management Made Simple
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Trigger Webhooks
              <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                Anywhere, Anytime
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Create, manage, and trigger webhook endpoints with ease. Perfect for developers who need
              reliable webhook management with comprehensive logging and security features.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="text-lg px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0" asChild>
                <Link href="/signup">
                  Start Free Today
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-4 border-blue-200 text-blue-600 hover:bg-blue-50" asChild>
                <Link href="/login">Sign In</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Light background decoration */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-gradient-to-br from-blue-200 to-purple-200 opacity-20 blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-gradient-to-br from-purple-200 to-pink-200 opacity-20 blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-gradient-to-br from-blue-200 to-indigo-200 opacity-15 blur-2xl"></div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
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
                <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-white">
                  <CardHeader>
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mb-4">
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-xl text-gray-900">{feature.title}</CardTitle>
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
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Why Choose WebTrigger?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Built for developers who need reliable, secure, and easy-to-use webhook management
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-start space-x-4 p-6 rounded-lg bg-gray-50 border border-gray-100 hover:border-blue-200 transition-all duration-300 hover:shadow-lg">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                  <CheckCircle className="h-6 w-6 text-white" />
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
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Choose the plan that fits your webhook management needs
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricing.map((plan, index) => (
              <Card key={index} className={`relative border transition-all duration-300 bg-white ${plan.popular
                ? 'border-blue-500 shadow-xl scale-105'
                : 'border-gray-200 hover:border-blue-300 hover:shadow-lg'
                }`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}
                <CardHeader className="text-center pb-8">
                  <CardTitle className="text-2xl text-gray-900">{plan.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-gray-900">${plan.price}</span>
                    <span className="text-gray-500 ml-1">/month</span>
                  </div>
                  <CardDescription className="text-gray-600 mt-2">
                    {plan.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center text-gray-700">
                        <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={`w-full transition-all duration-300 ${plan.popular
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white'
                      : 'bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 hover:border-blue-300'
                      }`}
                    variant={plan.popular ? "default" : "outline"}
                  >
                    {plan.cta}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of developers who trust WebTrigger for their webhook management needs
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-lg px-8 py-4 bg-white text-blue-600 hover:bg-gray-100" asChild>
              <Link href="/signup">
                Create Free Account
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-4 border-white text-white hover:bg-white hover:text-blue-600" asChild>
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
                <li><Link href="/docs" className="hover:text-white">Documentation</Link></li>
                <li><Link href="/docs/api-reference" className="hover:text-white">API Reference</Link></li>
                <li><Link href="/docs/community" className="hover:text-white">Community</Link></li>
                <li><Link href="/docs/contact" className="hover:text-white">Contact Us</Link></li>
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
