# Localization and RTL support for Login Page

Make the login/signup page fully localized in Arabic (RTL support and translated texts) and English, ensuring the user interface responds dynamically and correctly to language selection.

## Proposed Changes

### Locales

#### [MODIFY] [en.json](file:///c:/Users/ah383/Desktop/Ali-design/ad-genius/src/locales/en.json)
#### [MODIFY] [ar.json](file:///c:/Users/ah383/Desktop/Ali-design/ad-genius/src/locales/ar.json)
- Add translation keys for the login screen:
  - Header: Meta title and meta description
  - Card title and subtitle (Welcome back vs Create your account)
  - Google button text
  - Divider text ("or")
  - Inputs: Name, Email, Password (labels and placeholder texts)
  - Validation/auth feedback: "Check your email...", errors
  - Buttons: Sign in, Sign up, Create account
  - Switch text: "Already have an account?" / "Don't have an account?"
  - Bottom branding: "Powered by نماذج Ai..."

---

### Components & Routes

#### [MODIFY] [login.tsx](file:///c:/Users/ah383/Desktop/Ali-design/ad-genius/src/routes/login.tsx)
- Add `useTranslation()` from `react-i18next` inside `LoginPage`.
- Replace all hardcoded strings with translation keys (`t("login_...")`).
- Import and render `<LanguageSwitcher />` in the upper corner of the login layout (positioned nicely in LTR/RTL) so users can easily change the language directly on this page.
- Update Tailwind styles for inputs/icons to use CSS logical properties (`ps-`, `pe-`, `start-`, `end-`) instead of absolute properties (`pl-`, `pr-`, `left-`, `right-`) to support RTL natively when language is Arabic.
- Add `rtl:rotate-180` and `rtl:group-hover:-translate-x-0.5` to the `ArrowRight` icon on the submit button so the motion and glyph direction are correct in Arabic.

---

## Verification Plan

### Automated/Build Verification
- Verify that `npm run dev` compiles successfully with no syntax or type errors in `login.tsx`.

### Manual Verification
- Access the login page (`http://localhost:5174/login` or similar dev URL).
- Switch the language between English and Arabic using the new Language Switcher.
- Verify:
  - Text is fully translated into Arabic.
  - Page direction flips (RTL mode).
  - Icons (User, Mail, Lock, Eye) are positioned correctly on the respective side.
  - Arrow on the submit button rotates and points to the left, with the hover slide effect moving to the left.
  - Form validation states/messages are shown cleanly.
