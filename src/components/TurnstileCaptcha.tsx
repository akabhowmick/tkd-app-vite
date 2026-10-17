import { forwardRef } from "react";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";

// Captcha is only active when a Turnstile site key is configured. The matching
// secret key lives in Supabase → Authentication → Attack Protection, which then
// rejects sign-up, password sign-in and password-reset requests without a token.
const getSiteKey = () => import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined;

export const isCaptchaEnabled = () => Boolean(getSiteKey());

export type { TurnstileInstance };

interface TurnstileCaptchaProps {
  onToken: (token: string | undefined) => void;
}

// Tokens are single-use: call ref.current?.reset() after every auth request so the
// next attempt gets a fresh one.
const TurnstileCaptcha = forwardRef<TurnstileInstance | undefined, TurnstileCaptchaProps>(
  ({ onToken }, ref) => {
    const siteKey = getSiteKey();
    if (!siteKey) return null;

    return (
      <Turnstile
        ref={ref}
        siteKey={siteKey}
        onSuccess={onToken}
        onExpire={() => onToken(undefined)}
        onError={() => onToken(undefined)}
        options={{ size: "flexible", theme: "light" }}
      />
    );
  },
);

TurnstileCaptcha.displayName = "TurnstileCaptcha";

export default TurnstileCaptcha;
