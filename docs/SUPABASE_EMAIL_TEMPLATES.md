# Supabase Email Templates

Use this file when customizing the emails Supabase Auth sends to players.

## Confirm Signup Email

In Supabase, open:

Authentication -> Email Templates -> Confirm signup

Set the subject to:

```text
Confirm your NBA Ultimate Draft account
```

Set the body to the HTML from:

```text
docs/supabase-confirm-email-template.html
```

Important: keep this exact variable somewhere in the email body:

```text
{{ .ConfirmationURL }}
```

Supabase replaces that variable with the real confirmation link for each user.

## Recommended Dashboard Settings

Open:

Authentication -> URL Configuration

Set the Site URL to your live game URL when you deploy.

Add redirect URLs for every place users may confirm from, such as:

```text
http://localhost:5173
https://your-live-domain.com
```

## Best Production Sender Setup

The template can work with Supabase's default email sender while testing. Before sending to real users, set up custom SMTP so confirmation emails come from your own sender instead of the default Supabase sender.

Open:

Project Settings -> Authentication -> SMTP Settings

Use an email provider like Resend, Postmark, SendGrid, or another transactional email service. Do not put SMTP passwords in frontend code or in this repository.
