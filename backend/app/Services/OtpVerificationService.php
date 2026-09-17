<?php

namespace App\Services;

use App\Models\OtpVerification;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use RuntimeException;

class OtpVerificationService
{
    public const OTP_TTL_MINUTES = 5;
    public const OTP_LENGTH = 6;
    public const MAX_ATTEMPTS = 5;
    public const RESEND_COOLDOWN_SECONDS = 60;

    public function createForUser(User $user): array
    {
        if ($user->status !== 'active') {
            throw new RuntimeException('Account is not active.');
        }

        if ($this->isResendBlocked($user)) {
            throw new RuntimeException('Please wait before requesting a new verification code.');
        }

        OtpVerification::where('user_id', $user->id)
            ->where('is_used', false)
            ->update([
                'is_used' => true,
                'used_at' => now(),
            ]);

        $otp = (string) random_int(0, (10 ** self::OTP_LENGTH) - 1);
        $otp = str_pad($otp, self::OTP_LENGTH, '0', STR_PAD_LEFT);

        OtpVerification::create([
            'user_id' => $user->id,
            'otp_hash' => Hash::make($otp),
            'expires_at' => now()->addMinutes(self::OTP_TTL_MINUTES),
            'attempts' => 0,
            'is_used' => false,
            'last_sent_at' => now(),
        ]);

        $this->sendOtpEmail($user->email, $otp);

        return [
            'masked_email' => $this->maskEmail($user->email),
            'resend_cooldown_seconds' => self::RESEND_COOLDOWN_SECONDS,
            'expires_in_seconds' => self::OTP_TTL_MINUTES * 60,
        ];
    }

    public function verifyOtp(User $user, string $otp): bool
    {
        $record = OtpVerification::where('user_id', $user->id)
            ->where('is_used', false)
            ->orderByDesc('created_at')
            ->first();

        if (! $record) {
            throw new RuntimeException('Invalid or expired verification code.');
        }

        if ($record->isExpired()) {
            $record->markUsed();
            throw new RuntimeException('Invalid or expired verification code.');
        }

        if (! Hash::check($otp, $record->otp_hash)) {
            $record->increment('attempts');

            if ($record->attempts >= self::MAX_ATTEMPTS) {
                $record->markUsed();
            }

            throw new RuntimeException('Invalid or expired verification code.');
        }

        $record->markUsed();

        return true;
    }

    public function maskEmail(string $email): string
    {
        $parts = explode('@', strtolower(trim($email)));
        if (count($parts) !== 2) {
            return '***@***';
        }

        [$local, $domain] = $parts;
        $visible = strlen($local) > 2 ? substr($local, 0, 2) : substr($local, 0, 1);

        return $visible . '***@' . $domain;
    }

    protected function isResendBlocked(User $user): bool
    {
        $latest = OtpVerification::where('user_id', $user->id)
            ->orderByDesc('last_sent_at')
            ->first();

        if (! $latest || ! $latest->last_sent_at) {
            return false;
        }

        return $latest->last_sent_at->diffInSeconds(now()) < self::RESEND_COOLDOWN_SECONDS;
    }

    protected function sendOtpEmail(string $email, string $otp): void
    {
        $smtpHost = env('OTP_SMTP_HOST', env('MAIL_HOST'));
        $smtpUsername = env('OTP_SMTP_USERNAME', env('MAIL_USERNAME'));
        $smtpPassword = env('OTP_SMTP_PASSWORD', env('MAIL_PASSWORD'));

        if (blank($smtpHost) || blank($smtpUsername) || blank($smtpPassword)) {
            Log::warning('OTP email delivery skipped because SMTP credentials are not configured.');
            return;
        }

        $mail = new PHPMailer(true);

        try {
            $mail->isSMTP();
            $mail->SMTPAuth = true;
            $mail->CharSet = 'UTF-8';
            $mail->Host = $smtpHost;
            $mail->Port = (int) env('OTP_SMTP_PORT', env('MAIL_PORT', 587));
            $mail->Username = $smtpUsername;
            $mail->Password = $smtpPassword;
            $mail->SMTPSecure = env('OTP_SMTP_ENCRYPTION', env('MAIL_ENCRYPTION', PHPMailer::ENCRYPTION_STARTTLS));
            $mail->setFrom(
                env('OTP_SMTP_FROM_ADDRESS', env('MAIL_FROM_ADDRESS', 'noreply@localhost')),
                env('OTP_SMTP_FROM_NAME', env('MAIL_FROM_NAME', 'PCMS'))
            );
            $mail->addAddress($email);
            $mail->isHTML(true);
            $mail->Subject = 'PCMS – Login Verification';
            $mail->Body = $this->buildEmailHtml($otp);
            $mail->AltBody = "PCMS – Login Verification\n\nUse the following verification code to continue signing in:\n\n{$otp}\n\nThis code will expire in 5 minutes. If you did not attempt to sign in, you can ignore this email.";

            $mail->send();
        } catch (\Throwable $exception) {
            Log::error('OTP email send failed', [
                'email' => $email,
                'error' => $exception->getMessage(),
            ]);

            throw new RuntimeException('Unable to send the verification code at this time. Please try again later.');
        }
    }

    protected function buildEmailHtml(string $otp): string
    {
        return sprintf(
            <<<'HTML'
                <div style="font-family: Arial, sans-serif; background: #f4f7fb; padding: 32px 16px; color: #111827;">
                  <div style="max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e5e7eb;">
                    <div style="padding: 26px 24px 12px; background: linear-gradient(135deg, #eff6ff, #f8fbff); border-bottom: 1px solid #e5e7eb;">
                      <div style="font-size: 12px; letter-spacing: 1.6px; font-weight: 700; color: #2563eb; text-transform: uppercase;">
                        PCMS
                      </div>
                      <h2 style="margin: 10px 0 0; font-size: 28px; color: #0f172a;">Login Verification</h2>
                    </div>
                    <div style="padding: 24px;">
                      <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #374151;">
                        Use the following verification code to continue signing in:
                      </p>
                      <div style="margin: 24px 0; text-align: center; font-size: 36px; font-weight: 700; letter-spacing: 10px; color: #111827; background: #f8fafc; border: 1px solid #dfe7f1; border-radius: 12px; padding: 16px 20px;">
                        %s
                      </div>
                      <p style="margin: 0; font-size: 14px; line-height: 1.7; color: #4b5563;">
                        This code will expire in 5 minutes. If you did not attempt to sign in, you can ignore this email.
                      </p>
                    </div>
                  </div>
                </div>
            HTML,
            $otp
        );
    }
}
