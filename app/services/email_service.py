import resend
import os
from dotenv import load_dotenv

load_dotenv()

resend.api_key = os.getenv("RESEND_API_KEY")

FROM_EMAIL = "onboarding@resend.dev"  # Use this for sandbox testing

def send_invoice_created(customer_email: str, customer_name: str, invoice_id: int, amount: float, due_date: str):
    try:
        resend.Emails.send({
            "from": FROM_EMAIL,
            "to": customer_email,
            "subject": f"Invoice #{invoice_id} - Payment Due",
            "html": f"""
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #4f46e5;">Invoice #{invoice_id}</h2>
                <p>Dear {customer_name},</p>
                <p>An invoice has been created for you.</p>
                <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                    <tr style="background: #f9fafb;">
                        <td style="padding: 12px; border: 1px solid #e5e7eb;">Amount Due</td>
                        <td style="padding: 12px; border: 1px solid #e5e7eb;"><strong>KES {amount:,.2f}</strong></td>
                    </tr>
                    <tr>
                        <td style="padding: 12px; border: 1px solid #e5e7eb;">Due Date</td>
                        <td style="padding: 12px; border: 1px solid #e5e7eb;"><strong>{due_date}</strong></td>
                    </tr>
                    <tr style="background: #f9fafb;">
                        <td style="padding: 12px; border: 1px solid #e5e7eb;">Invoice ID</td>
                        <td style="padding: 12px; border: 1px solid #e5e7eb;">#{invoice_id}</td>
                    </tr>
                </table>
                <p>Please make payment before the due date to avoid penalties.</p>
                <p style="color: #6b7280; font-size: 12px;">This is an automated message from Payment Reconciliation SaaS.</p>
            </div>
            """
        })
        return True
    except Exception as e:
        print(f"Email error: {e}")
        return False

def send_payment_received(customer_email: str, customer_name: str, invoice_id: int, amount: float, reference: str, channel: str):
    try:
        resend.Emails.send({
            "from": FROM_EMAIL,
            "to": customer_email,
            "subject": f"Payment Received - KES {amount:,.2f}",
            "html": f"""
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #16a34a;">Payment Received</h2>
                <p>Dear {customer_name},</p>
                <p>We have received your payment. Thank you!</p>
                <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                    <tr style="background: #f9fafb;">
                        <td style="padding: 12px; border: 1px solid #e5e7eb;">Amount Paid</td>
                        <td style="padding: 12px; border: 1px solid #e5e7eb;"><strong>KES {amount:,.2f}</strong></td>
                    </tr>
                    <tr>
                        <td style="padding: 12px; border: 1px solid #e5e7eb;">Invoice</td>
                        <td style="padding: 12px; border: 1px solid #e5e7eb;">#{invoice_id}</td>
                    </tr>
                    <tr style="background: #f9fafb;">
                        <td style="padding: 12px; border: 1px solid #e5e7eb;">Payment Channel</td>
                        <td style="padding: 12px; border: 1px solid #e5e7eb;">{channel.upper()}</td>
                    </tr>
                    <tr>
                        <td style="padding: 12px; border: 1px solid #e5e7eb;">Reference</td>
                        <td style="padding: 12px; border: 1px solid #e5e7eb;">{reference or "N/A"}</td>
                    </tr>
                </table>
                <p style="color: #6b7280; font-size: 12px;">This is an automated message from Payment Reconciliation SaaS.</p>
            </div>
            """
        })
        return True
    except Exception as e:
        print(f"Email error: {e}")
        return False

def send_overdue_reminder(customer_email: str, customer_name: str, invoice_id: int, amount: float, due_date: str, days_overdue: int):
    try:
        resend.Emails.send({
            "from": FROM_EMAIL,
            "to": customer_email,
            "subject": f"Overdue Invoice #{invoice_id} - Action Required",
            "html": f"""
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #ef4444;">Overdue Invoice Notice</h2>
                <p>Dear {customer_name},</p>
                <p>This is a reminder that the following invoice is <strong>{days_overdue} days overdue</strong>.</p>
                <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                    <tr style="background: #fef2f2;">
                        <td style="padding: 12px; border: 1px solid #fecaca;">Invoice ID</td>
                        <td style="padding: 12px; border: 1px solid #fecaca;">#{invoice_id}</td>
                    </tr>
                    <tr>
                        <td style="padding: 12px; border: 1px solid #fecaca;">Amount Due</td>
                        <td style="padding: 12px; border: 1px solid #fecaca;"><strong>KES {amount:,.2f}</strong></td>
                    </tr>
                    <tr style="background: #fef2f2;">
                        <td style="padding: 12px; border: 1px solid #fecaca;">Due Date</td>
                        <td style="padding: 12px; border: 1px solid #fecaca;">{due_date}</td>
                    </tr>
                </table>
                <p>Please make payment immediately to avoid further action.</p>
                <p style="color: #6b7280; font-size: 12px;">This is an automated message from Payment Reconciliation SaaS.</p>
            </div>
            """
        })
        return True
    except Exception as e:
        print(f"Email error: {e}")
        return False

def send_password_reset_email(email: str, token: str):
    reset_url = f"https://recon-saas.vercel.app/reset-password?token={token}"
    try:
        resend.Emails.send({
            "from": FROM_EMAIL,
            "to": email,
            "subject": "Reset Your Password",
            "html": f"""
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #4f46e5;">Reset Your Password</h2>
                <p>You requested a password reset for your Payment Reconciliation account.</p>
                <p>Click the button below to reset your password. This link expires in 1 hour.</p>
                <a href="{reset_url}" style="display: inline-block; padding: 12px 24px; background: #4f46e5; color: #fff; text-decoration: none; border-radius: 4px; margin: 20px 0;">Reset Password</a>
                <p>If you didn't request this, ignore this email.</p>
                <p style="color: #6b7280; font-size: 12px;">This is an automated message from Payment Reconciliation SaaS.</p>
            </div>
            """
        })
        return True
    except Exception as e:
        print(f"Email error: {e}")
        return False
