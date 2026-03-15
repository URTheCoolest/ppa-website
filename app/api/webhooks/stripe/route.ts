import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/admin'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-02-25.clover',
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const signature = req.headers.get('stripe-signature')

    let event: Stripe.Event

    if (!process.env.STRIPE_WEBHOOK_SECRET || !signature) {
      console.log('No webhook secret, parsing as test event')
      event = JSON.parse(body)
    } else {
      event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET)
    }

    const supabase = createAdminClient()

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      
      const licenseRequestId = session.metadata?.licenseRequestId
      const clientId = session.metadata?.clientId
      const photographerId = session.metadata?.photographerId
      const amountPaid = session.amount_total ? session.amount_total / 100 : 0

      console.log('Processing payment:', { licenseRequestId, clientId, photographerId, amountPaid })

      if (licenseRequestId) {
        const photographerShare = Math.round(amountPaid * 0.8 * 100) / 100
        const agencyShare = Math.round(amountPaid * 0.2 * 100) / 100

        // Update license request
        const { error: updateError } = await supabase
          .from('license_requests')
          .update({ status: 'approved', completed_at: new Date().toISOString() })
          .eq('id', licenseRequestId)

        console.log('License update result:', updateError)

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
        console.log('Payment processed:', licenseRequestId)
      }
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
