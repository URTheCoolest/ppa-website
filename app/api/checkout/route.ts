import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
})

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await req.json()
    const { licenseRequestId, clientId } = body

    // Get license request details
    const { data: licenseRequest, error: requestError } = await supabase
      .from('license_requests')
      .select('*, media(filename, media_type)')
      .eq('id', licenseRequestId)
      .single()

    if (requestError || !licenseRequest) {
      return NextResponse.json({ error: 'License request not found' }, { status: 404 })
    }

    // Get client email
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', clientId)
      .single()

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'pln',
            product_data: {
              name: `License: ${licenseRequest.media?.filename || 'Media'}`,
              description: `${licenseRequest.media_type} - ${licenseRequest.usage_type} use`,
            },
            unit_amount: Math.round(licenseRequest.price_pln * 100), // Stripe uses cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.get('origin')}/portal/my-requests?success=true&requestId=${licenseRequestId}`,
      cancel_url: `${req.headers.get('origin')}/portal/my-requests?canceled=true`,
      customer_email: profile?.email,
      metadata: {
        licenseRequestId,
        clientId,
        photographerId: licenseRequest.photographer_id,
      },
    })

    // Update license request with session ID
    await supabase
      .from('license_requests')
      .update({ 
        // Store session info for later reference
      })
      .eq('id', licenseRequestId)

    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (error: any) {
    console.error('Stripe error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
