import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Create admin client with service role key for user creation
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const demoAccounts = [
      {
        email: 'owner@lostintime.com',
        password: 'password123',
        role: 'owner',
        first_name: 'John',
        last_name: 'Owner'
      },
      {
        email: 'staff@lostintime.com', 
        password: 'password123',
        role: 'staff',
        first_name: 'Jane',
        last_name: 'Staff'
      }
    ]

    const results = []

    for (const account of demoAccounts) {
      try {
        // Create user with admin client
        const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
          email: account.email,
          password: account.password,
          email_confirm: true,
          user_metadata: {
            first_name: account.first_name,
            last_name: account.last_name,
            role: account.role
          }
        })

        if (userError) {
          if (userError.message.includes('already registered')) {
            results.push({ email: account.email, status: 'already_exists' })
            continue
          }
          throw userError
        }

        results.push({ 
          email: account.email, 
          status: 'created',
          user_id: userData.user?.id 
        })

      } catch (error) {
        results.push({ 
          email: account.email, 
          status: 'error', 
          error: error instanceof Error ? error.message : 'Unknown error occurred'
        })
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Demo accounts processing completed',
        results 
      }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        } 
      }
    )

  } catch (error) {
    console.error('Error creating demo accounts:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        } 
      }
    )
  }
})