# Taper Check

A mobile-friendly taper quantity calculator and input consistency checker built with React + Vite.

## What it does

- Add unlimited taper steps.
- Enter tablets per dose manually.
- Choose common frequency options or enter a custom doses/day value.
- Choose duration in days, weeks, or 30-day months.
- Calculates each step quantity and the total quantity.
- Shows a compact normalized "Taper Check" for manual double-checking.
- Flags basic sequence issues such as an increase in tablets per dose or frequency.
- Optional whole-tablet rounding for the dispensing view.
- Copy a clean text summary.
- Automatically saves the current draft in the browser's local storage.
- Responsive mobile-first UI.
- Includes calculation tests.

## Important calculation rule

All durations are normalized to days:

- 1 day = 1 day
- 1 week = 7 days
- 1 month = 30 days

Quantity:

`tablets per dose × doses per day × duration in days`

This project intentionally does not make clinical decisions. It checks arithmetic, input completeness, and basic sequence consistency only.

## Run locally

Install Node.js LTS, then:

```bash
npm install
npm run dev
```

Open the local Vite URL shown in the terminal.

## Verify before deployment

```bash
npm test
npm run build
```

Both should complete successfully.

## Deploy to Vercel

1. Upload this project to GitHub.
2. Import the GitHub repository into Vercel.
3. Framework preset: Vite.
4. Build command: `npm run build`
5. Output directory: `dist`
6. Install command: `npm install`
7. Deploy.

No environment variables are required.

## GitHub upload

You can either upload the files through GitHub's web interface or use Git:

```bash
git init
git add .
git commit -m "Initial Taper Check release"
git branch -M main
git remote add origin YOUR_GITHUB_REPOSITORY_URL
git push -u origin main
```

## Suggested production checklist

- Test on iPhone Safari and Android Chrome.
- Test every frequency option.
- Test days, weeks, and 30-day months.
- Test decimal tablet doses if your workflow needs them.
- Verify the exact total against a manual calculation before using any result operationally.


## V2 updates
- Enter taper steps by prescribed dose (mg) or by number of tablets/capsules.
- Converts dose to unit count using tablet/capsule strength.
- Includes verification-only total quantity disclaimer.
- Project Leader: YARA ALOMARI.
