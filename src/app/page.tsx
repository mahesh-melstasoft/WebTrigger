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
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Enhanced Neon Background */}
      <div className="fixed inset-0 -z-10">
        {/* Primary neon gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black"></div>

        {/* Dramatic neon orbs with enhanced glow */}
        <div className="absolute top-20 left-10 w-96 h-96 bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 rounded-full opacity-30 animate-float-slow blur-3xl shadow-[0_0_100px_rgba(34,211,238,0.3)]"></div>
        <div className="absolute top-40 right-20 w-80 h-80 bg-gradient-to-br from-purple-500 via-pink-500 to-rose-600 rounded-full opacity-25 animate-float-reverse blur-2xl shadow-[0_0_80px_rgba(168,85,247,0.4)]"></div>
        <div className="absolute bottom-32 left-1/4 w-72 h-72 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 rounded-full opacity-20 animate-float-medium blur-3xl shadow-[0_0_120px_rgba(79,70,229,0.3)]"></div>
        <div className="absolute top-1/3 right-10 w-64 h-64 bg-gradient-to-br from-pink-600 via-rose-600 to-red-600 rounded-full opacity-25 animate-float-reverse-slow blur-2xl shadow-[0_0_90px_rgba(236,72,153,0.4)]"></div>
        <div className="absolute bottom-20 right-1/3 w-80 h-80 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-full opacity-22 animate-float-slow blur-3xl shadow-[0_0_110px_rgba(147,51,234,0.3)]"></div>

        {/* Additional floating neon elements */}
        <div className="absolute top-1/4 left-1/2 w-32 h-32 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-full opacity-40 animate-float-medium blur-xl shadow-[0_0_60px_rgba(16,185,129,0.5)]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full opacity-35 animate-float-reverse blur-2xl shadow-[0_0_70px_rgba(139,92,246,0.4)]"></div>

        {/* Neon geometric shapes */}
        <div className="absolute top-16 left-1/3 w-4 h-4 bg-cyan-400 rounded-full opacity-80 animate-pulse-glow shadow-[0_0_20px_rgba(34,211,238,0.8)]"></div>
        <div className="absolute top-32 right-1/4 w-3 h-3 bg-pink-400 rounded-full opacity-90 animate-pulse-glow-delayed shadow-[0_0_15px_rgba(244,114,182,0.9)]"></div>
        <div className="absolute bottom-40 left-16 w-5 h-5 bg-purple-400 rounded-full opacity-70 animate-pulse-glow shadow-[0_0_25px_rgba(168,85,247,0.7)]"></div>
        <div className="absolute top-2/3 right-16 w-4 h-4 bg-blue-400 rounded-full opacity-85 animate-pulse-glow-delayed shadow-[0_0_18px_rgba(59,130,246,0.8)]"></div>
        <div className="absolute top-1/2 left-1/4 w-2 h-2 bg-emerald-400 rounded-full opacity-95 animate-pulse-glow shadow-[0_0_12px_rgba(16,185,129,1)]"></div>

        {/* Animated grid overlay with neon effect */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-shimmer shadow-[0_0_10px_rgba(34,211,238,0.3)]"></div>
        </div>

        {/* Additional neon lines */}
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-50"></div>
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-400 to-transparent opacity-50"></div>
        <div className="absolute left-0 top-0 w-px h-full bg-gradient-to-b from-transparent via-pink-400 to-transparent opacity-50"></div>
        <div className="absolute right-0 top-0 w-px h-full bg-gradient-to-b from-transparent via-blue-400 to-transparent opacity-50"></div>
      </div>
      <nav className="border-b border-gray-800/50 bg-black/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Webhook className="h-8 w-8 text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
                <div className="absolute inset-0 h-8 w-8 bg-cyan-400 rounded-full blur-md opacity-50 animate-pulse-glow"></div>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">
                WebTrigger
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" className="text-gray-300 hover:text-cyan-400 hover:bg-gray-800/50 border border-gray-700/50" asChild>
                <Link href="/login">Sign In</Link>
              </Button>
              <Button className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white border-0 shadow-[0_0_20px_rgba(34,211,238,0.3)]" asChild>
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
            <Badge className="mb-6 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-300 border-cyan-500/30 hover:from-cyan-500/30 hover:to-purple-500/30 shadow-[0_0_15px_rgba(34,211,238,0.2)]">
              <Sparkles className="h-3 w-3 mr-1 text-cyan-400" />
              Smart Webhook Management Made Simple
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Trigger Webhooks
              <span className="block bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(34,211,238,0.5)] animate-pulse-glow">
                Anywhere, Anytime
              </span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              Create, manage, and trigger webhook endpoints with ease. Perfect for developers who need
              reliable webhook management with comprehensive logging and security features.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="text-lg px-8 py-4 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white border-0 shadow-[0_0_25px_rgba(34,211,238,0.4)] hover:shadow-[0_0_35px_rgba(34,211,238,0.6)] transition-all duration-300" asChild>
                <Link href="/signup">
                  Start Free Today
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-4 border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/10 hover:border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.2)] hover:shadow-[0_0_25px_rgba(34,211,238,0.4)] transition-all duration-300" asChild>
                <Link href="/login">Sign In</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Enhanced background decoration */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 opacity-20 blur-3xl shadow-[0_0_100px_rgba(34,211,238,0.3)]"></div>
          <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 opacity-20 blur-3xl shadow-[0_0_100px_rgba(168,85,247,0.3)]"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 opacity-15 blur-2xl shadow-[0_0_80px_rgba(79,70,229,0.2)]"></div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 drop-shadow-[0_0_20px_rgba(34,211,238,0.3)]">
              Powerful Features for Modern Webhooks
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Everything you need to manage webhooks efficiently and securely
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="border border-gray-700/50 shadow-lg hover:shadow-[0_0_30px_rgba(34,211,238,0.2)] transition-all duration-300 bg-gray-800/50 backdrop-blur-sm hover:bg-gray-700/50 hover:border-cyan-500/30">
                  <CardHeader>
                    <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-lg flex items-center justify-center mb-4 shadow-[0_0_15px_rgba(34,211,238,0.4)]">
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-xl text-white">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-gray-300">
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
      <section className="py-20 bg-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 drop-shadow-[0_0_20px_rgba(34,211,238,0.3)]">
              Why Choose WebTrigger?
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Built for developers who need reliable, secure, and easy-to-use webhook management
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-start space-x-4 p-6 rounded-lg bg-gray-900/50 border border-gray-700/30 hover:border-cyan-500/30 transition-all duration-300 hover:shadow-[0_0_25px_rgba(34,211,238,0.2)]">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-1 shadow-[0_0_15px_rgba(34,211,238,0.4)]">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">{benefit.title}</h3>
                  <p className="text-gray-300">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-black/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 drop-shadow-[0_0_20px_rgba(34,211,238,0.3)]">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Choose the plan that fits your webhook management needs
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricing.map((plan, index) => (
              <Card key={index} className={`relative border transition-all duration-300 backdrop-blur-sm ${plan.popular
                  ? 'border-cyan-500/50 bg-gray-800/50 shadow-[0_0_40px_rgba(34,211,238,0.3)] hover:shadow-[0_0_50px_rgba(34,211,238,0.4)] scale-105'
                  : 'border-gray-700/50 bg-gray-900/50 hover:bg-gray-800/50 hover:border-cyan-500/30 hover:shadow-[0_0_30px_rgba(34,211,238,0.2)]'
                }`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-cyan-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-[0_0_20px_rgba(34,211,238,0.5)]">
                      Most Popular
                    </span>
                  </div>
                )}
                <CardHeader className="text-center pb-8">
                  <CardTitle className="text-2xl text-white">{plan.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-white">${plan.price}</span>
                    <span className="text-gray-400 ml-1">/month</span>
                  </div>
                  <CardDescription className="text-gray-300 mt-2">
                    {plan.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center text-gray-300">
                        <Check className="h-5 w-5 text-cyan-400 mr-3 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={`w-full transition-all duration-300 ${plan.popular
                        ? 'bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white shadow-[0_0_20px_rgba(34,211,238,0.5)] hover:shadow-[0_0_30px_rgba(34,211,238,0.6)]'
                        : 'bg-gray-700 hover:bg-gray-600 text-white border border-gray-600 hover:border-cyan-500/50'
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
      <section className="py-20 bg-gradient-to-br from-gray-900 via-black to-gray-900 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-64 h-64 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-full opacity-20 blur-3xl shadow-[0_0_100px_rgba(34,211,238,0.3)]"></div>
          <div className="absolute bottom-10 right-10 w-64 h-64 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full opacity-20 blur-3xl shadow-[0_0_100px_rgba(168,85,247,0.3)]"></div>
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 drop-shadow-[0_0_20px_rgba(34,211,238,0.3)]">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Join thousands of developers who trust WebTrigger for their webhook management needs
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-lg px-8 py-4 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white border-0 shadow-[0_0_25px_rgba(34,211,238,0.4)] hover:shadow-[0_0_35px_rgba(34,211,238,0.6)] transition-all duration-300" asChild>
              <Link href="/signup">
                Create Free Account
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-4 border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/10 hover:border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.2)] hover:shadow-[0_0_25px_rgba(34,211,238,0.4)] transition-all duration-300" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-50"></div>
          <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-400 to-transparent opacity-50"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="relative">
                  <Webhook className="h-6 w-6 text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
                  <div className="absolute inset-0 h-6 w-6 bg-cyan-400 rounded-full blur-md opacity-50 animate-pulse-glow"></div>
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">
                  WebTrigger
                </span>
              </div>
              <p className="text-gray-400">
                Smart webhook management made simple. Create, trigger, and monitor your webhooks with ease.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4 text-white">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/dashboard" className="hover:text-cyan-400 transition-colors">Dashboard</Link></li>
                <li><Link href="/settings" className="hover:text-cyan-400 transition-colors">Settings</Link></li>
                <li><Link href="/login" className="hover:text-cyan-400 transition-colors">Login</Link></li>
                <li><Link href="/signup" className="hover:text-cyan-400 transition-colors">Sign Up</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4 text-white">Features</h3>
              <ul className="space-y-2 text-gray-400">
                <li className="hover:text-cyan-400 transition-colors">Webhook Management</li>
                <li className="hover:text-cyan-400 transition-colors">Trigger URLs</li>
                <li className="hover:text-cyan-400 transition-colors">Logging & Analytics</li>
                <li className="hover:text-cyan-400 transition-colors">Two-Factor Auth</li>
                <li className="hover:text-cyan-400 transition-colors">Custom Timeouts</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4 text-white">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/docs" className="hover:text-cyan-400 transition-colors">Documentation</Link></li>
                <li><Link href="/docs/api-reference" className="hover:text-cyan-400 transition-colors">API Reference</Link></li>
                <li><Link href="/docs/community" className="hover:text-cyan-400 transition-colors">Community</Link></li>
                <li><Link href="/docs/contact" className="hover:text-cyan-400 transition-colors">Contact Us</Link></li>
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
