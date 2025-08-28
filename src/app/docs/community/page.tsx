'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    ArrowLeft,
    Users,
    MessageCircle,
    Github,
    BookOpen,
    ExternalLink,
    Mail,
    Twitter,
    MessageCircle as DiscordIcon,
    Youtube,
    Code,
    Heart
} from 'lucide-react';

export default function Community() {
    const communityResources = [
        {
            title: "GitHub Repository",
            description: "Contribute to the project, report bugs, and request features",
            icon: Github,
            link: "https://github.com",
            color: "text-gray-900",
            bgColor: "bg-gray-100",
            type: "Development"
        },
        {
            title: "Discord Community",
            description: "Join our Discord server for real-time discussions and support",
            icon: DiscordIcon,
            link: "#",
            color: "text-indigo-600",
            bgColor: "bg-indigo-100",
            type: "Chat"
        },
        {
            title: "Twitter",
            description: "Follow us for updates, tips, and community highlights",
            icon: Twitter,
            link: "https://twitter.com",
            color: "text-blue-500",
            bgColor: "bg-blue-100",
            type: "Social"
        },
        {
            title: "YouTube Channel",
            description: "Watch tutorials, demos, and educational content",
            icon: Youtube,
            link: "https://youtube.com",
            color: "text-red-600",
            bgColor: "bg-red-100",
            type: "Video"
        }
    ];

    const helpResources = [
        {
            title: "Documentation",
            description: "Comprehensive guides and API reference",
            icon: BookOpen,
            link: "/docs",
            items: [
                "Getting Started Guide",
                "API Reference",
                "Best Practices",
                "Troubleshooting"
            ]
        },
        {
            title: "Support Forum",
            description: "Community-driven Q&A and discussions",
            icon: MessageCircle,
            link: "#",
            items: [
                "General Discussion",
                "Technical Support",
                "Feature Requests",
                "Bug Reports"
            ]
        },
        {
            title: "Code Examples",
            description: "Sample code and integration examples",
            icon: Code,
            link: "#",
            items: [
                "Webhook Receivers",
                "Authentication",
                "Error Handling",
                "Testing Tools"
            ]
        }
    ];

    const recentDiscussions = [
        {
            title: "How to handle webhook retries?",
            author: "sarah_dev",
            replies: 12,
            time: "2 hours ago",
            tags: ["webhooks", "reliability"]
        },
        {
            title: "Custom path validation best practices",
            author: "webhook_ninja",
            replies: 8,
            time: "5 hours ago",
            tags: ["custom-paths", "security"]
        },
        {
            title: "Integrating with Zapier workflows",
            author: "automation_guru",
            replies: 15,
            time: "1 day ago",
            tags: ["integration", "zapier"]
        },
        {
            title: "Rate limiting and quota management",
            author: "api_architect",
            replies: 6,
            time: "2 days ago",
            tags: ["rate-limiting", "scaling"]
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
                            Community
                        </h1>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            Join our community of developers building amazing webhook integrations.
                        </p>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                {/* Community Resources */}
                <div className="mb-12">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Connect With Us</h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {communityResources.map((resource, index) => {
                            const Icon = resource.icon;
                            return (
                                <Card key={index} className="hover:shadow-lg transition-shadow">
                                    <CardHeader className="text-center">
                                        <div className={`w-12 h-12 ${resource.bgColor} rounded-lg flex items-center justify-center mx-auto mb-4`}>
                                            <Icon className={`h-6 w-6 ${resource.color}`} />
                                        </div>
                                        <CardTitle className="text-lg">{resource.title}</CardTitle>
                                        <Badge variant="outline" className="w-fit mx-auto">
                                            {resource.type}
                                        </Badge>
                                    </CardHeader>
                                    <CardContent className="text-center">
                                        <p className="text-gray-600 mb-4">{resource.description}</p>
                                        <Button asChild variant="outline" className="w-full">
                                            <a href={resource.link} target="_blank" rel="noopener noreferrer">
                                                Join Community
                                                <ExternalLink className="h-4 w-4 ml-2" />
                                            </a>
                                        </Button>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>

                {/* Help Resources */}
                <div className="mb-12">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Get Help</h2>
                    <div className="grid md:grid-cols-3 gap-6">
                        {helpResources.map((resource, index) => {
                            const Icon = resource.icon;
                            return (
                                <Card key={index}>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Icon className="h-6 w-6 text-blue-500" />
                                            {resource.title}
                                        </CardTitle>
                                        <CardDescription>{resource.description}</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <ul className="space-y-2 mb-4">
                                            {resource.items.map((item, itemIndex) => (
                                                <li key={itemIndex} className="flex items-center gap-2 text-sm text-gray-600">
                                                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                        <Button asChild variant="outline" className="w-full">
                                            <a href={resource.link}>
                                                {resource.title === "Documentation" ? "View Docs" : "Visit Forum"}
                                                <ExternalLink className="h-4 w-4 ml-2" />
                                            </a>
                                        </Button>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>

                {/* Recent Discussions */}
                <div className="mb-12">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Discussions</h2>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MessageCircle className="h-6 w-6 text-blue-500" />
                                Community Forum
                            </CardTitle>
                            <CardDescription>
                                Latest discussions from our community
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {recentDiscussions.map((discussion, index) => (
                                    <div key={index} className="flex items-start justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-gray-900 mb-2">
                                                {discussion.title}
                                            </h4>
                                            <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                                                <span className="flex items-center gap-1">
                                                    <Users className="h-4 w-4" />
                                                    {discussion.author}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <MessageCircle className="h-4 w-4" />
                                                    {discussion.replies} replies
                                                </span>
                                                <span>{discussion.time}</span>
                                            </div>
                                            <div className="flex gap-2">
                                                {discussion.tags.map((tag, tagIndex) => (
                                                    <Badge key={tagIndex} variant="secondary" className="text-xs">
                                                        {tag}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="sm">
                                            View Discussion
                                            <ExternalLink className="h-4 w-4 ml-1" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-6 text-center">
                                <Button asChild>
                                    <a href="#">
                                        View All Discussions
                                        <ExternalLink className="h-4 w-4 ml-2" />
                                    </a>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Contributing */}
                <div className="mb-12">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Contribute</h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Code className="h-6 w-6 text-green-500" />
                                    Code Contributions
                                </CardTitle>
                                <CardDescription>
                                    Help improve the platform by contributing code
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2 text-gray-600 mb-4">
                                    <li className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                        Fix bugs and issues
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                        Add new features
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                        Improve documentation
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                        Write tests
                                    </li>
                                </ul>
                                <Button asChild variant="outline" className="w-full">
                                    <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                                        View on GitHub
                                        <ExternalLink className="h-4 w-4 ml-2" />
                                    </a>
                                </Button>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Heart className="h-6 w-6 text-red-500" />
                                    Community Support
                                </CardTitle>
                                <CardDescription>
                                    Help others and share your knowledge
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2 text-gray-600 mb-4">
                                    <li className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                        Answer questions in the forum
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                        Create tutorials and guides
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                        Share integration examples
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                        Report bugs and issues
                                    </li>
                                </ul>
                                <Button asChild variant="outline" className="w-full">
                                    <a href="#">
                                        Join Community
                                        <ExternalLink className="h-4 w-4 ml-2" />
                                    </a>
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Newsletter Signup */}
                <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl">Stay Updated</CardTitle>
                        <CardDescription>
                            Subscribe to our newsletter for the latest updates, tutorials, and community news.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                        <div className="max-w-md mx-auto">
                            <div className="flex gap-2">
                                <input
                                    type="email"
                                    placeholder="Enter your email"
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <Button>
                                    Subscribe
                                    <Mail className="h-4 w-4 ml-2" />
                                </Button>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                We respect your privacy. Unsubscribe at any time.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
