type BookingConfirmationEmailProps = {
  participantName: string
  participantEmail: string
  workshopTitle: string
  workshopDate: string
  workshopStartTime: string
  workshopEndTime: string
  workshopLocation: string
  instructorName: string
  bookingId: number
}

export async function sendBookingConfirmationEmail(props: BookingConfirmationEmailProps) {
  const {
    participantName,
    participantEmail,
    workshopTitle,
    workshopDate,
    workshopStartTime,
    workshopEndTime,
    workshopLocation,
    instructorName,
    bookingId,
  } = props

  // Format date
  const date = new Date(workshopDate)
  const formattedDate = date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  })

  // Format time
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":")
    const hour = Number.parseInt(hours)
    const ampm = hour >= 12 ? "PM" : "AM"
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const emailHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Workshop Booking Confirmation</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f9f9f9;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }
          .header {
            background: linear-gradient(135deg, #d97706 0%, #dc2626 100%);
            color: #ffffff;
            padding: 32px 24px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 700;
          }
          .content {
            padding: 32px 24px;
          }
          .workshop-details {
            background-color: #fef3c7;
            border-left: 4px solid #d97706;
            padding: 20px;
            margin: 24px 0;
            border-radius: 4px;
          }
          .workshop-details h2 {
            margin: 0 0 16px 0;
            font-size: 20px;
            color: #92400e;
          }
          .detail-row {
            display: flex;
            margin: 8px 0;
            font-size: 14px;
          }
          .detail-label {
            font-weight: 600;
            color: #92400e;
            min-width: 120px;
          }
          .detail-value {
            color: #451a03;
          }
          .info-box {
            background-color: #f3f4f6;
            border-radius: 6px;
            padding: 16px;
            margin: 24px 0;
          }
          .info-box h3 {
            margin: 0 0 12px 0;
            font-size: 16px;
            color: #374151;
          }
          .info-box ul {
            margin: 0;
            padding-left: 20px;
            color: #6b7280;
          }
          .info-box li {
            margin: 6px 0;
          }
          .footer {
            background-color: #f9fafb;
            padding: 24px;
            text-align: center;
            color: #6b7280;
            font-size: 14px;
            border-top: 1px solid #e5e7eb;
          }
          .booking-number {
            font-size: 12px;
            color: #9ca3af;
            margin-top: 8px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎪 Paradise Circus</h1>
            <p style="margin: 8px 0 0 0; font-size: 16px;">Workshop Booking Confirmation</p>
          </div>
          
          <div class="content">
            <p>Dear ${participantName},</p>
            
            <p>Thank you for booking a workshop with Paradise Circus! Your spot has been confirmed.</p>
            
            <div class="workshop-details">
              <h2>${workshopTitle}</h2>
              <div class="detail-row">
                <span class="detail-label">Date:</span>
                <span class="detail-value">${formattedDate}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Time:</span>
                <span class="detail-value">${formatTime(workshopStartTime)} - ${formatTime(workshopEndTime)}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Location:</span>
                <span class="detail-value">${workshopLocation}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Instructor:</span>
                <span class="detail-value">${instructorName}</span>
              </div>
            </div>
            
            <div class="info-box">
              <h3>What to Bring:</h3>
              <ul>
                <li>Comfortable, flexible clothing</li>
                <li>Water bottle to stay hydrated</li>
                <li>Enthusiasm and a willingness to learn!</li>
              </ul>
            </div>
            
            <div class="info-box">
              <h3>Important Information:</h3>
              <ul>
                <li>Please arrive 15 minutes early to check in</li>
                <li>All equipment will be provided</li>
                <li>Contact us if you need to make any changes</li>
              </ul>
            </div>
            
            <p>We're excited to see you at the workshop! If you have any questions or need to make changes to your booking, please don't hesitate to reach out.</p>
            
            <p>See you under the big top!</p>
            
            <p style="margin-top: 24px;">
              <strong>The Paradise Circus Team</strong>
            </p>
            
            <p class="booking-number">Booking Reference: #${bookingId}</p>
          </div>
          
          <div class="footer">
            <p style="margin: 0;">Paradise Circus - Where dreams take flight</p>
            <p style="margin: 8px 0 0 0; font-size: 12px;">
              This is an automated confirmation email. Please do not reply to this message.
            </p>
          </div>
        </div>
      </body>
    </html>
  `

  const emailText = `
Paradise Circus - Workshop Booking Confirmation

Dear ${participantName},

Thank you for booking a workshop with Paradise Circus! Your spot has been confirmed.

Workshop Details:
- Title: ${workshopTitle}
- Date: ${formattedDate}
- Time: ${formatTime(workshopStartTime)} - ${formatTime(workshopEndTime)}
- Location: ${workshopLocation}
- Instructor: ${instructorName}

What to Bring:
- Comfortable, flexible clothing
- Water bottle to stay hydrated
- Enthusiasm and a willingness to learn!

Important Information:
- Please arrive 15 minutes early to check in
- All equipment will be provided
- Contact us if you need to make any changes

We're excited to see you at the workshop!

Booking Reference: #${bookingId}

The Paradise Circus Team
Where dreams take flight
  `

  console.log("[v0] Email notification prepared for:", participantEmail)
  console.log("[v0] Workshop:", workshopTitle)
  console.log("[v0] To implement actual email sending, integrate with Resend, SendGrid, or similar service")

  // For now, just log the email content
  // In production, integrate with an email service:

  // Example with Resend:
  // const resend = new Resend(process.env.RESEND_API_KEY)
  // await resend.emails.send({
  //   from: 'Paradise Circus <bookings@paradisecircus.com>',
  //   to: participantEmail,
  //   subject: `Booking Confirmed: ${workshopTitle}`,
  //   html: emailHtml,
  //   text: emailText,
  // })

  return {
    success: true,
    html: emailHtml,
    text: emailText,
  }
}

type AdminNotificationEmailProps = {
  participantName: string
  participantEmail: string
  participantPhone: string | null
  workshopTitle: string
  workshopDate: string
  workshopStartTime: string
  bookingId: number
}

export async function sendAdminNotificationEmail(props: AdminNotificationEmailProps) {
  const {
    participantName,
    participantEmail,
    participantPhone,
    workshopTitle,
    workshopDate,
    workshopStartTime,
    bookingId,
  } = props

  const date = new Date(workshopDate)
  const formattedDate = date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  })

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":")
    const hour = Number.parseInt(hours)
    const ampm = hour >= 12 ? "PM" : "AM"
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const adminEmail = process.env.ADMIN_EMAIL || "admin@paradisecircus.com"

  const emailHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Workshop Booking</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f9f9f9;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }
          .header {
            background-color: #374151;
            color: #ffffff;
            padding: 24px;
            border-radius: 8px 8px 0 0;
          }
          .header h1 {
            margin: 0;
            font-size: 20px;
          }
          .content {
            padding: 24px;
          }
          .booking-info {
            background-color: #f3f4f6;
            border-radius: 6px;
            padding: 16px;
            margin: 16px 0;
          }
          .info-row {
            margin: 8px 0;
            font-size: 14px;
          }
          .label {
            font-weight: 600;
            color: #374151;
          }
          .value {
            color: #6b7280;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔔 New Workshop Booking Received</h1>
          </div>
          <div class="content">
            <p>A new booking has been made for <strong>${workshopTitle}</strong>.</p>
            
            <div class="booking-info">
              <div class="info-row">
                <span class="label">Participant:</span> 
                <span class="value">${participantName}</span>
              </div>
              <div class="info-row">
                <span class="label">Email:</span> 
                <span class="value">${participantEmail}</span>
              </div>
              ${participantPhone ? `<div class="info-row"><span class="label">Phone:</span> <span class="value">${participantPhone}</span></div>` : ""}
              <div class="info-row">
                <span class="label">Workshop Date:</span> 
                <span class="value">${formattedDate} at ${formatTime(workshopStartTime)}</span>
              </div>
              <div class="info-row">
                <span class="label">Booking ID:</span> 
                <span class="value">#${bookingId}</span>
              </div>
            </div>
            
            <p style="font-size: 14px; color: #6b7280;">
              View and manage this booking in your admin dashboard.
            </p>
          </div>
        </div>
      </body>
    </html>
  `

  console.log("[v0] Admin notification prepared for:", adminEmail)
  console.log("[v0] New booking ID:", bookingId)

  // In production, send to admin email
  // await sendEmail({
  //   to: adminEmail,
  //   subject: `New Booking: ${workshopTitle}`,
  //   html: adminEmail,
  // })

  return { success: true }
}
