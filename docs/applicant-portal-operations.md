# Migrz applicant portal operations

The applicant portal runs on the existing `migrz-web` Cloudflare Worker at
`https://apply.migrzz.com`. Applicant records use the `migrz-applications` D1
database and uploaded evidence uses the private
`migrz-applicant-documents` R2 bucket.

## Payment routing

- Country of residence `NG` routes to Paystack.
- Every other country routes to PayPal.
- Standard assessment: USD 350.
- Accelerated assessment: USD 550. Same business day when purchased before
  12:00 PM WAT; otherwise the next business day.

Access is activated only after a provider-signed webhook or a server-side
provider verification confirms the exact payment reference, currency, and
amount. Email codes establish identity; they do not activate paid access.

## Required Worker secrets

Configure these as Cloudflare Worker secrets. Never put their values in source
control or a local committed environment file.

- `SESSION_SECRET`
- `ZEPTOMAIL_TOKEN`
- `PAYSTACK_SECRET_KEY`
- `WISE_API_TOKEN`
- `PAYPAL_CLIENT_ID`
- `PAYPAL_CLIENT_SECRET`
- `PAYPAL_WEBHOOK_ID`
- `CALENDLY_API_TOKEN`
- `CALENDLY_EVENT_TYPE_URI`
- `CALENDLY_WEBHOOK_SIGNING_KEY`

Optional Worker variables:

- `ZEPTOMAIL_FROM` (defaults to `comms@migrzz.com`; the address must be
  verified in ZeptoMail)
- `ZEPTOMAIL_FROM_NAME` (defaults to `Migrz`)
- `PAYPAL_MODE` (`sandbox` during testing; omit for live)
- Nigerian Paystack checkout is quoted in NGN using Wise's authenticated
  USD/NGN rate API. Migrz adds no FX markup, rounds to the nearest naira, shows
  the rate and timestamp, and locks the signed quote for 15 minutes.

## Provider webhooks

- Paystack: `https://apply.migrzz.com/api/portal/webhooks/paystack`
- PayPal: `https://apply.migrzz.com/api/portal/webhooks/paypal`
- Required PayPal event: `PAYMENT.CAPTURE.COMPLETED`
- Calendly: `https://apply.migrzz.com/api/portal/webhooks/calendly`
- Required Calendly events: `invitee.created` and `invitee.canceled`

## Review-call scheduling

Create one 60-minute Calendly event type for Migrz review calls and configure
its location to generate a unique Google Meet conference. Store that event
type's URI in `CALENDLY_EVENT_TYPE_URI`. When the three Calendly values are
present, applicants see live availability and receive an immediate confirmed
booking. If Calendly is unavailable or not configured, the existing preferred
time request remains available and administrators can confirm it manually.

The applicant action changes with the call lifecycle: confirmation details are
shown before the call, `Join review call` is used near the appointment, and
`Review next steps` replaces the meeting action after completion. Staff must
write an applicant-facing outcome before selecting `Call completed`. That
transition creates an in-portal notification and sends a ZeptoMail service
email; failed completion emails are retried by the five-minute Worker schedule.

Use sandbox/test credentials first. Complete a Standard and Accelerated test
purchase through each provider, confirm one entitlement is created per
payment, and verify that replaying a webhook does not create a second
entitlement.

## Data and support boundary

Applicant documents are private and can only be downloaded through an active,
paid applicant session. The portal collects assessment information for Migrz
human review. Engaged immigration case work moves to CaseVault; this portal is
not a replacement for CaseVault.

Before staff begin downloading arbitrary public uploads at volume, add malware
scanning/quarantine and a staff review console with least-privilege access.
