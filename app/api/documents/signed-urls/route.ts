import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { paths } = await req.json();

    if (!paths || !Array.isArray(paths)) {
      return NextResponse.json({ error: 'Missing paths array' }, { status: 400 });
    }

    // Security: If unauthenticated, only allow generating URLs for the public demo group
    const authHeader = req.headers.get('Authorization');
    let user = null;
    
    if (authHeader) {
      const { data } = await supabaseAdmin.auth.getUser(authHeader.split(' ')[1]);
      user = data?.user;
    }

    if (!user) {
      console.log('[API] Unauthenticated request, checking path safety for:', paths);
      const isPublicOnly = paths.every(p => p.startsWith('00000000-0000-0000-0000-000000000000/'));
      if (!isPublicOnly) {
        console.warn('[API] Blocked attempt to sign private paths:', paths.filter(p => !p.startsWith('00000000-0000-0000-0000-000000000000/')));
        return NextResponse.json({ error: 'Unauthorized: Cannot access private documents without a session.' }, { status: 401 });
      }
    }

    // Use service role to generate signed URLs
    const { data, error } = await supabaseAdmin.storage
      .from('family_vault')
      .createSignedUrls(paths, 3600); // 1 hour

    if (error) {
      console.error('Error generating signed URLs:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Debug log for paths that failed within the data array
    const failures = data.filter(d => d.error);
    if (failures.length > 0) {
      console.warn('[API] Some paths failed to sign:', failures);
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
