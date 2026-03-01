/**
 * Invite Email Template — Story 1.3 AC2
 *
 * Generates HTML and plain text email templates for team invitations.
 */

interface InviteEmailParams {
  organizationName: string;
  inviterName: string;
  inviteLink: string;
  recipientEmail: string;
  role: 'admin' | 'member' | 'viewer';
  expiresInDays: number;
}

function getRoleName(role: string): string {
  const roleNames: Record<string, string> = {
    admin: 'Administrator',
    member: 'Team Member',
    viewer: 'Viewer',
  };
  return roleNames[role] || role;
}

/**
 * Generate plain text email
 */
export function generatePlainTextEmail(params: InviteEmailParams): string {
  return `
Hello,

${params.inviterName} has invited you to join "${params.organizationName}" as a ${getRoleName(params.role)}.

To accept this invitation and create your account, click the link below:

${params.inviteLink}

This invitation will expire in ${params.expiresInDays} days.

If you didn't expect this email, you can safely ignore it.

---
ZapCRM Team
  `.trim();
}

/**
 * Generate HTML email
 */
export function generateHtmlEmail(params: InviteEmailParams): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f5f5f5;
      margin: 0;
      padding: 20px;
      line-height: 1.6;
      color: #333;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .content {
      padding: 40px 20px;
    }
    .content p {
      margin: 16px 0;
      font-size: 14px;
    }
    .content strong {
      color: #667eea;
    }
    .cta-section {
      text-align: center;
      margin: 32px 0;
    }
    .cta-button {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 12px 32px;
      text-decoration: none;
      border-radius: 6px;
      display: inline-block;
      font-weight: 600;
      transition: transform 0.2s;
    }
    .cta-button:hover {
      transform: scale(1.05);
    }
    .link-text {
      word-break: break-all;
      color: #667eea;
      margin: 16px 0;
      padding: 12px;
      background-color: #f5f5f5;
      border-radius: 4px;
      font-size: 12px;
    }
    .footer {
      background-color: #f5f5f5;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #666;
      border-top: 1px solid #e0e0e0;
    }
    .role-badge {
      display: inline-block;
      background-color: #e0e7ff;
      color: #667eea;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      margin: 8px 0;
    }
    .expiry-notice {
      background-color: #fef3cd;
      border-left: 4px solid #ffc107;
      padding: 12px;
      border-radius: 4px;
      margin: 20px 0;
      font-size: 12px;
      color: #856404;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to ZapCRM</h1>
      <p style="margin: 8px 0 0 0;">You've been invited to join a team</p>
    </div>

    <div class="content">
      <p>Hello,</p>

      <p>
        <strong>${params.inviterName}</strong> has invited you to join
        <strong>"${params.organizationName}"</strong> as a:
      </p>

      <div style="text-align: center;">
        <div class="role-badge">${getRoleName(params.role)}</div>
      </div>

      <p>
        As a ${getRoleName(params.role).toLowerCase()}, you'll be able to:
      </p>

      <ul style="font-size: 14px; line-height: 1.8;">
        ${
          params.role === 'admin'
            ? `
            <li>Manage team members and their roles</li>
            <li>Access all organization data</li>
            <li>Update organization settings</li>
            <li>View audit logs</li>
          `
            : params.role === 'member'
              ? `
            <li>View and edit organization data</li>
            <li>Collaborate with team members</li>
            <li>Create and manage projects</li>
          `
              : `
            <li>View organization data (read-only)</li>
            <li>Access reports and dashboards</li>
          `
        }
      </ul>

      <div class="cta-section">
        <a href="${params.inviteLink}" class="cta-button">Accept Invitation</a>
      </div>

      <p style="text-align: center; font-size: 12px; color: #666;">
        Or copy this link:
      </p>
      <div class="link-text">${params.inviteLink}</div>

      <div class="expiry-notice">
        ⏰ This invitation will expire in <strong>${params.expiresInDays} days</strong>.
        Accept it soon to join the team!
      </div>

      <p style="font-size: 12px; color: #666; margin-top: 32px;">
        If you didn't expect this email or have questions, please contact
        <strong>${params.inviterName}</strong> directly.
      </p>
    </div>

    <div class="footer">
      <p>© ${new Date().getFullYear()} ZapCRM. All rights reserved.</p>
      <p>
        This is an automated message. Please do not reply to this email.
        If you have questions, contact your organization administrator.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Email data structure for sending
 */
export function createInviteEmail(params: InviteEmailParams) {
  return {
    to: params.recipientEmail,
    subject: `${params.inviterName} invited you to ${params.organizationName}`,
    text: generatePlainTextEmail(params),
    html: generateHtmlEmail(params),
  };
}
