import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = createSupabaseServerClient();
  await supabase.auth.signOut();
  
  const origin = new URL(request.url).origin;
  return NextResponse.redirect(`${origin}/fr`, { status: 302 });
}
