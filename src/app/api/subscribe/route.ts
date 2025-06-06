import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY not configured')
      return NextResponse.json(
        { error: 'Newsletter service not configured' },
        { status: 500 }
      )
    }

    // Generate secure confirmation token
    const timestamp = Date.now()
    const signature = createHash('sha256')
      .update(`${email}|${timestamp}|${process.env.CONFIRMATION_SECRET_KEY || 'fallback-secret'}`)
      .digest('hex')
    
    const confirmationToken = Buffer.from(`${email}|${timestamp}|${signature}`).toString('base64url')
    
    // Send confirmation email first
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'newsletter@newfrontier.app', // Replace with your verified domain
        to: email,
        subject: 'Confirm your subscription - New Frontier Essays',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2c3e50; margin-bottom: 20px;">Welcome to New Frontier!</h2>
            <p style="color: #555; line-height: 1.6;">
              Thanks for your interest in our thoughtful explorations of ethics, society, and the future of humanity.
            </p>
            <p style="color: #555; line-height: 1.6;">
              You'll receive essays examining the ethical questions at the intersection of technology, capitalism, and human relations. Please confirm your subscription:
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.APP_URL || 'http://localhost:3000'}/api/confirm?token=${confirmationToken}" 
                 style="background-color: #4a9d9c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Confirm Subscription
              </a>
            </div>
            <p style="color: #777; font-size: 14px;">
              If you didn't sign up for this newsletter, you can safely ignore this email.
            </p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">
              New Frontier • Thoughts on Ethics, Society & the Future of Humanity
            </p>
          </div>
        `,
      }),
    })

    if (!emailResponse.ok) {
      const errorData = await emailResponse.text()
      console.error('Failed to send confirmation email:', errorData)
      return NextResponse.json(
        { error: 'Failed to send confirmation email' },
        { status: 500 }
      )
    }

    // Store pending subscription (you might want to use a database for this)
    // For now, we'll just return success - the confirmation endpoint will handle adding to audience

    return NextResponse.json(
      { message: 'Please check your email to confirm your subscription!' },
      { status: 200 }
    )

  } catch (error) {
    console.error('Newsletter subscription error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}