'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    ArrowLeft,
    Mail,
    MessageCircle,
    Phone,
    MapPin,
    Clock,
    Send,
    CheckCircle,
    AlertCircle,
    HelpCircle,
    FileText,
    Bug,
    Lightbulb
} from 'lucide-react';

export default function Contact() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        category: '',
        message: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSubmitStatus('idle');

        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 2000));

            // In a real app, you would send this to your backend
            console.log('Form submitted:', formData);

            setSubmitStatus('success');
            setFormData({
                name: '',
                email: '',
                subject: '',
                category: '',
                message: ''
            });
        } catch (error) {
            console.error('Error submitting form:', error);
            setSubmitStatus('error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const contactMethods = [
        {
            title: "Email Support",
            description: "Get help with technical issues and general inquiries",
            icon: Mail,
            contact: "support@webtrigger.com",
            availability: "24/7",
            responseTime: "Within 2 hours"
        },
        {
            title: "Live Chat",
            description: "Chat with our support team in real-time",
            icon: MessageCircle,
            contact: "Available 9 AM - 6 PM EST",
            availability: "Business Hours",
            responseTime: "Immediate"
        },
        {
            title: "Phone Support",
            description: "Speak directly with our technical support team",
            icon: Phone,
            contact: "+1 (555) 123-4567",
            availability: "Mon-Fri 9 AM - 6 PM EST",
            responseTime: "Immediate"
        }
    ];

    const faqCategories = [
        {
            icon: HelpCircle,
            title: "General Questions",
            description: "Common questions about WebTrigger",
            questions: [
                "How do I get started?",
                "What are the pricing plans?",
                "How do custom paths work?",
                "Is there a free trial?"
            ]
        },
        {
            icon: Bug,
            title: "Technical Issues",
            description: "Problems with webhooks or API",
            questions: [
                "My webhook isn&apos;t triggering",
                "I&apos;m getting authentication errors",
                "How do I debug webhook failures?",
                "Rate limiting questions"
            ]
        },
        {
            icon: Lightbulb,
            title: "Feature Requests",
            description: "Suggest new features or improvements",
            questions: [
                "How can I request a new feature?",
                "Can I contribute to the codebase?",
                "Integration with other services",
                "Custom webhook transformations"
            ]
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50/50">
            {/* Header */}
            <div className="bg-white border-b">
                <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-4 mb-4">
                        <Button variant="ghost" asChild>
                            <Link href="/docs">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Documentation
                            </Link>
                        </Button>
                    </div>
                    <div className="text-center">
                        <h1 className="text-4xl font-bold text-gray-900 mb-4">
                            Contact Us
                        </h1>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            Get in touch with our support team. We&apos;re here to help you succeed with WebTrigger.
                        </p>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                {/* Contact Methods */}
                <div className="mb-12">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Get in Touch</h2>
                    <div className="grid md:grid-cols-3 gap-6">
                        {contactMethods.map((method, index) => {
                            const Icon = method.icon;
                            return (
                                <Card key={index}>
                                    <CardHeader className="text-center">
                                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                                            <Icon className="h-6 w-6 text-blue-600" />
                                        </div>
                                        <CardTitle>{method.title}</CardTitle>
                                        <CardDescription>{method.description}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="text-center space-y-3">
                                        <div className="font-semibold text-gray-900">{method.contact}</div>
                                        <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                                            <Clock className="h-4 w-4" />
                                            {method.availability}
                                        </div>
                                        <div className="text-sm text-green-600 font-medium">
                                            {method.responseTime}
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>

                {/* Contact Form */}
                <div className="mb-12">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Send us a Message</h2>
                    <div className="grid lg:grid-cols-3 gap-8">
                        {/* Form */}
                        <div className="lg:col-span-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Contact Form</CardTitle>
                                    <CardDescription>
                                        Fill out the form below and we&apos;ll get back to you as soon as possible.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleSubmit} className="space-y-6">
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="name">Name *</Label>
                                                <Input
                                                    id="name"
                                                    type="text"
                                                    placeholder="Your full name"
                                                    value={formData.name}
                                                    onChange={(e) => handleInputChange('name', e.target.value)}
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="email">Email *</Label>
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    placeholder="your.email@example.com"
                                                    value={formData.email}
                                                    onChange={(e) => handleInputChange('email', e.target.value)}
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="category">Category *</Label>
                                            <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a category" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="general">General Question</SelectItem>
                                                    <SelectItem value="technical">Technical Support</SelectItem>
                                                    <SelectItem value="billing">Billing & Subscription</SelectItem>
                                                    <SelectItem value="feature">Feature Request</SelectItem>
                                                    <SelectItem value="bug">Bug Report</SelectItem>
                                                    <SelectItem value="other">Other</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="subject">Subject *</Label>
                                            <Input
                                                id="subject"
                                                type="text"
                                                placeholder="Brief description of your inquiry"
                                                value={formData.subject}
                                                onChange={(e) => handleInputChange('subject', e.target.value)}
                                                required
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="message">Message *</Label>
                                            <Textarea
                                                id="message"
                                                placeholder="Please provide details about your question or issue..."
                                                value={formData.message}
                                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('message', e.target.value)}
                                                rows={6}
                                                required
                                            />
                                        </div>

                                        {submitStatus === 'success' && (
                                            <Alert className="bg-green-50 border-green-200 text-green-800">
                                                <CheckCircle className="h-4 w-4" />
                                                <AlertDescription>
                                                    Thank you for your message! We&apos;ll get back to you within 2 hours.
                                                </AlertDescription>
                                            </Alert>
                                        )}

                                        {submitStatus === 'error' && (
                                            <Alert variant="destructive">
                                                <AlertCircle className="h-4 w-4" />
                                                <AlertDescription>
                                                    There was an error sending your message. Please try again or contact us directly.
                                                </AlertDescription>
                                            </Alert>
                                        )}

                                        <Button
                                            type="submit"
                                            className="w-full"
                                            disabled={isSubmitting}
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                    Sending...
                                                </>
                                            ) : (
                                                <>
                                                    Send Message
                                                    <Send className="h-4 w-4 ml-2" />
                                                </>
                                            )}
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>
                        </div>

                        {/* FAQ Categories */}
                        <div>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Quick Help</CardTitle>
                                    <CardDescription>
                                        Find answers to common questions
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {faqCategories.map((category, index) => {
                                        const Icon = category.icon;
                                        return (
                                            <div key={index}>
                                                <div className="flex items-center gap-2 mb-3">
                                                    <Icon className="h-5 w-5 text-blue-500" />
                                                    <h4 className="font-semibold text-gray-900">{category.title}</h4>
                                                </div>
                                                <p className="text-sm text-gray-600 mb-3">{category.description}</p>
                                                <ul className="space-y-2">
                                                    {category.questions.map((question, qIndex) => (
                                                        <li key={qIndex} className="text-sm text-gray-700 flex items-start gap-2">
                                                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                                                            {question}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        );
                                    })}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>

                {/* Office Information */}
                <div className="mb-12">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Visit Our Office</h2>
                    <Card>
                        <CardContent className="p-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div className="flex items-start gap-3">
                                        <MapPin className="h-5 w-5 text-blue-500 mt-0.5" />
                                        <div>
                                            <h4 className="font-semibold text-gray-900">Headquarters</h4>
                                            <p className="text-gray-600">
                                                123 Webhook Street<br />
                                                San Francisco, CA 94105<br />
                                                United States
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <Clock className="h-5 w-5 text-blue-500 mt-0.5" />
                                        <div>
                                            <h4 className="font-semibold text-gray-900">Business Hours</h4>
                                            <p className="text-gray-600">
                                                Monday - Friday: 9:00 AM - 6:00 PM PST<br />
                                                Saturday: 10:00 AM - 4:00 PM PST<br />
                                                Sunday: Closed
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h4 className="font-semibold text-gray-900">Getting Here</h4>
                                    <p className="text-gray-600 text-sm">
                                        We&apos;re located in the heart of San Francisco&apos;s tech district,
                                        easily accessible by BART, Muni, and major highways.
                                        Parking is available in nearby garages.
                                    </p>
                                    <div className="aspect-video bg-gray-200 rounded-lg flex items-center justify-center">
                                        <p className="text-gray-500 text-sm">Interactive Map</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Additional Resources */}
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Additional Resources</h2>
                    <div className="grid md:grid-cols-3 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="h-6 w-6 text-blue-500" />
                                    Knowledge Base
                                </CardTitle>
                                <CardDescription>
                                    Browse our comprehensive documentation
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button asChild variant="outline" className="w-full">
                                    <Link href="/docs">
                                        View Documentation
                                        <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <MessageCircle className="h-6 w-6 text-green-500" />
                                    Community Forum
                                </CardTitle>
                                <CardDescription>
                                    Get help from our community
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button asChild variant="outline" className="w-full">
                                    <Link href="/docs/community">
                                        Join Community
                                        <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Mail className="h-6 w-6 text-purple-500" />
                                    Status Page
                                </CardTitle>
                                <CardDescription>
                                    Check system status and maintenance
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button asChild variant="outline" className="w-full">
                                    <a href="#" target="_blank" rel="noopener noreferrer">
                                        View Status
                                        <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
                                    </a>
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
