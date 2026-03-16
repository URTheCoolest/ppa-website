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
      
      console.log('Full session metadata:', JSON.stringify(session.metadata))
      
      let licenseRequestId = session.metadata?.licenseRequestId
      const clientId = session.metadata?.clientId
      const photographerId = session.metadata?.photographerId
      const amountPaid = session.amount_total ? session.amount_total / 100 : 0

      console.log('Payment details from metadata:', { licenseRequestId, clientId, photographerId, amountPaid })

      // Verify we have the required data
      if (!licenseRequestId || !clientId) {
        console.error('MISSING REQUIRED METADATA! licenseRequestId:', licenseRequestId, 'clientId:', clientId)
        return NextResponse.json({ error: 'Missing required metadata' }, { status: 400 })
      }

      // Import Supabase admin client
      const { createClient } = require('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

      // First, verify the license request exists and is in pending status
      console.log('Looking up license request:', licenseRequestId)
      const { data: existingRequest, error: lookupError } = await supabase
        .from('license_requests')
        .select('id, status, client_id, price_pln')
        .eq('id', licenseRequestId)
        .single()

      console.log('License request lookup:', { existingRequest, lookupError })

      if (lookupError || !existingRequest) {
        console.error('Could not find license request:', licenseRequestId, lookupError)
        // Try fallback method
        if (clientId && amountPaid) {
          console.log('Trying fallback: finding pending request by client/amount')
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
            console.log('Found pending request via fallback:', licenseRequestId)
          }
        }
      } else {
        console.log('Found license request, current status:', existingRequest.status)
      }

      if (!licenseRequestId) {
        console.error('No license request ID found after all attempts!')
        return NextResponse.json({ error: 'No license request ID found' }, { status: 400 })
      }

      const photographerShare = Math.round(amountPaid * 0.8 * 100) / 100
      const agencyShare = Math.round(amountPaid * 0.2 * 100) / 100

      // Update license request status to approved
      console.log('Updating license request:', licenseRequestId, 'to status: approved')
      const { error: updateError } = await supabase
        .from('license_requests')
        .update({ status: 'approved', completed_at: new Date().toISOString() })
        .eq('id', licenseRequestId)

      console.log('Update result - error:', updateError)

      // Record transaction
      console.log('Inserting transaction:', { clientId, photographerId, amountPaid })
      const { error: insertError } = await supabase
        .from('transactions')
        .insert({
          client_id: clientId,
          photographer_id: photographerId || null,
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
      
      console.log('Transaction insert result - error:', insertError)
      console.log('=== PAYMENT PROCESSED SUCCESSFULLY ===')
      console.log('License request:', licenseRequestId, 'status set to: approved')
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
