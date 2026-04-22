import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const groupId = searchParams.get('groupId') || '00000000-0000-0000-0000-000000000000';
    const PUBLIC_GROUP_ID = '00000000-0000-0000-0000-000000000000';

    // Security: Only allow public access to the designated demo group.
    // If we want to support multiple shared groups, we would need to check a 'is_public' flag in document_groups table.
    if (groupId !== PUBLIC_GROUP_ID) {
      console.warn(`[Security] Blocked unauthorized attempt to fetch documents for private group: ${groupId}`);
      return NextResponse.json({ error: 'Unauthorized: Access to private groups is restricted.' }, { status: 403 });
    }

    // Fetch documents using service role to bypass RLS for the public share page
    // (Bypassing RLS is safe here because we've already validated that the group is public)
    const { data, error } = await supabaseAdmin
      .from('documents')
      .select('*')
      .eq('group_id', groupId)
      .order('upload_date', { ascending: false });

    if (error) {
      console.error('Error fetching public documents:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
