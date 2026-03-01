/**
 * Next.js Middleware Entry Point — Story 1.4 AC1-AC3
 *
 * Runs on every request to detect and validate organization context.
 */

import { NextRequest, NextResponse } from 'next/server';
import { detectTenantId, detectAndValidateTenant, createTenantResponse } from '@/lib/middleware';
import { createClient } from '@supabase/supabase-js';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Skip middleware for public routes
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Get authenticated user
  const authHeader = request.headers.get('authorization');
  let userId: string | null = null;

  if (authHeader) {
    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_ANON_KEY || ''
    );

    try {
      const { data } = await supabase.auth.getUser(token);
      userId = data.user?.id || null;
    } catch (err) {
      // Auth header present but invalid
    }
  }

  // If not authenticated, redirect to login
  if (!userId) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  // Detect tenant
  const detection = detectTenantId(request);

  // Determine if this is API or web request
  const isApi = pathname.startsWith('/api');

  // Validate response
  const errorResponse = createTenantResponse(isApi, detection.organizationId);
  if (errorResponse) {
    if (isApi) {
      return NextResponse.json(
        { error: errorResponse.error },
        { status: errorResponse.status }
      );
    } else {
      return NextResponse.redirect(new URL(errorResponse.error, request.url));
    }
  }

  // Full validation (includes membership check)
  const tenantContext = await detectAndValidateTenant(request, userId as any);

  if (!tenantContext) {
    // Membership validation failed
    if (isApi) {
      return NextResponse.json(
        { error: 'User is not a member of this organization' },
        { status: 403 }
      );
    } else {
      return NextResponse.redirect(new URL('/select-organization', request.url));
    }
  }

  // Attach tenant context to request headers for downstream use
  const responseHeaders = new Headers(request.headers);
  responseHeaders.set('X-Organization-ID', tenantContext.organizationId);
  responseHeaders.set('X-User-ID', tenantContext.userId);
  responseHeaders.set('X-User-Role', tenantContext.role);

  // Set org_id cookie for web requests
  const response = NextResponse.next({
    request: {
      headers: responseHeaders,
    },
  });

  response.cookies.set('org_id', tenantContext.organizationId, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return response;
}

/**
 * Define routes that don't require tenant context
 */
function isPublicRoute(pathname: string): boolean {
  const publicRoutes = [
    '/auth/login',
    '/auth/signup',
    '/auth/callback',
    '/join', // Invite acceptance
    '/select-organization', // Org selector
    '/api/auth/invite/validate', // Validate without auth
    '/.well-known',
  ];

  return publicRoutes.some((route) => pathname.startsWith(route));
}

/**
 * Configure which routes this middleware applies to
 */
export const config = {
  matcher: [
    // Include all routes except Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Include API routes
    '/api/:path*',
  ],
};
