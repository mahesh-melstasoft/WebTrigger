import NextAuth, { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import GithubProvider from 'next-auth/providers/github';
import { prisma } from '@/lib/prisma';

export const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || '',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
        }),
        GithubProvider({
            clientId: process.env.GITHUB_CLIENT_ID || '',
            clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
        }),
    ],
    session: {
        strategy: 'jwt'
    },
    secret: process.env.NEXTAUTH_SECRET || process.env.ENCRYPTION_MASTER_KEY,
    callbacks: {
        async jwt({ token, account, profile }) {
            if (account && profile && profile.email) {
                // Upsert user in Prisma
                const user = await prisma.user.upsert({
                    where: { email: profile.email },
                    update: {
                        displayName: profile.name || profile.email.split('@')[0],
                    },
                    create: {
                        email: profile.email,
                        displayName: profile.name || profile.email.split('@')[0],
                        password: '', // OAuth users don't need password
                        role: 'FREE',
                        isActive: true,
                    },
                });
                token.userId = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            if (token.userId && session.user) {
                (session.user as { id: string }).id = token.userId as string;
            }
            return session;
        },
    },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
