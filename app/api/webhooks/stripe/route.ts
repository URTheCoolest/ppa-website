import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 })
  }

  const supabase = await createClient()

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      
      const licenseRequestId = session.metadata?.licenseRequestId
      const clientId = session.metadata?.clientId
      const photographerId = session.metadata?.photographerId
      const amountPaid = session.amount_total ? session.amount_total / 100 : 0

      if (licenseRequestId) {
        // Calculate split (80% photographer, 20% platform)
        const photographerShare = Math.round(amountPaid * 0.8 * 100) / 100
        const agencyShare = Math.round(amountPaid * 0.2 * 100) / 100

        // Update license request status
        await supabase
          .from('license_requests')
          .update({ 
            status: 'approved',
            completed_at: new Date().toISOString()
          })
          .eq('id', licenseRequestId)

        // Update photographer earnings
        if (photographerId) {
          await supabase.rpc('add_photographer_earnings', {
            p_photographer_id: photographerId,
            p_amount: photographerShare
          })
        }

        // Record transaction
        await supabase
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
        }

        console.log('Payment processed for license request:', licenseRequestId)
      }
      break
    }

    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      console.log('PaymentIntent succeeded:', paymentIntent.id)
      break
    }

    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      console.log('Payment failed:', paymentIntent.id)
      break
    }

    default:
      console.log(`Unhandled event type: ${event.type}`)
  }

  return NextResponse.json({ received: true })
}
