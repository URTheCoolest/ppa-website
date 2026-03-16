import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-02-25.clover',
})

export async function POST(req: NextRequest) {
  console.log('Webhook received')
  
  try {
    const body = await req.text()
    const signature = req.headers.get('stripe-signature')

    let event: Stripe.Event

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error('STRIPE_WEBHOOK_SECRET not set!')
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
    }

    if (!signature) {
      console.log('No signature, trying to parse as test')
      try {
        event = JSON.parse(body)
      } catch {
        return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
      }
    } else {
      try {
        event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET)
      } catch (err: any) {
        console.error('Webhook signature verification failed:', err.message)
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
      }
    }

    console.log('Event type:', event.type)

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      
      let licenseRequestId = session.metadata?.licenseRequestId
      const clientId = session.metadata?.clientId
      const photographerId = session.metadata?.photographerId
      const amountPaid = session.amount_total ? session.amount_total / 100 : 0

      console.log('Payment details from metadata:', { licenseRequestId, clientId, photographerId, amountPaid })

      // If no metadata, try to find the most recent pending license request for this client
      if (!licenseRequestId && clientId) {
        console.log('No metadata, searching for pending license request...')
        
        const { createClient } = require('@supabase/supabase-js')
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        // Find the most recent pending request for this client with matching amount
        const { data: pendingRequests } = await supabase
          .from('license_requests')
          .select('*')
          .eq('client_id', clientId)
          .eq('status', 'pending')
          .eq('price_pln', amountPaid)
          .order('created_at', { ascending: false })
          .limit(1)

        if (pendingRequests && pendingRequests.length > 0) {
          licenseRequestId = pendingRequests[0].id
          console.log('Found pending request:', licenseRequestId)
        }
      }

      if (!licenseRequestId) {
        console.error('No license request ID found!')
        return NextResponse.json({ error: 'No license request ID' }, { status: 400 })
      }

      // Import Supabase admin client
      const { createClient } = require('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

      const photographerShare = Math.round(amountPaid * 0.8 * 100) / 100
      const agencyShare = Math.round(amountPaid * 0.2 * 100) / 100

      // Update license request
      const { error: updateError } = await supabase
        .from('license_requests')
        .update({ status: 'approved', completed_at: new Date().toISOString() })
        .eq('id', licenseRequestId)

      console.log('Update result:', updateError)

      // Record transaction
      const { error: insertError } = await supabase
        .from('transactions')
        .insert({
          client_id: clientId,
          photographer_id: photographerId,
          type: 'license',
          reference_id: licenseRequestId,
          amount_pln: amountPaid,
          photographer_share: photographerShare,
          agency_share: agencyShare,
          status: 'completed',
          payment_method: 'stripe',
          transaction_id: session.payment_intent as string,
          completed_at: new Date().toISOString()
        })
      
      console.log('Transaction insert result:', insertError)
      console.log('Payment processed successfully for:', licenseRequestId)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
