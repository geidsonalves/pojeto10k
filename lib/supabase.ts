import { createClient } from "@supabase/supabase-js";
const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret=process.env.SUPABASE_SECRET_KEY;
if(!url||!secret) throw new Error("Supabase não configurado.");
export const supabase=createClient(url,secret,{auth:{autoRefreshToken:false,persistSession:false}});