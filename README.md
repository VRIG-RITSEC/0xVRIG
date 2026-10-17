This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### Walk-in and booth demos

`/demo` is the hands-on demo, styled like the Windows 95 foundations track. Type a name or payload and watch individual bytes fill the 16-byte buffer, spill into saved data, and overwrite the return address in red. Run the program to crash it, then replace the return address to reach admin. Two follow-up challenges cover address leaks and integer overflow.

`/demo/slideshow` is an unattended booth display. It types a name, overflows memory, crashes, repairs the payload, and reaches admin in a repeating **45-second loop**. Use the controls to choose 30, 45, or 60 seconds, pause/play, restart, jump to a step, or enter fullscreen. It pauses its clock in hidden tabs and disables typing/confetti animations for reduced-motion preferences. Watching the slideshow does not read or change personal challenge progress.

The QR code links to `https://aeshus.github.io/0xVRIG/demo`. Print `/0xVRIG/demo-booth.html` on the deployed site or use `public/demo-qr.svg`. To change the QR destination, update the booth HTML and slideshow URL, then regenerate it:

```sh
pnpm dlx qrcode --type svg --output public/demo-qr.svg https://aeshus.github.io/0xVRIG/demo
```

Run locally with `pnpm dev`. Verify with `pnpm test`, `pnpm lint`, `pnpm typecheck`, and `pnpm build`. Production paths include `/0xVRIG`.

Interactive drafts and completions stay in the same browser, separately from workshop progress. Older demo saves are migrated to the typed-payload format. Copying a link shares the challenge, not the saved progress. If storage is blocked, the demo continues in memory. Before the event, scan the printed QR and have first-time visitors try the crash → repair → admin sequence; the target is 45–90 seconds without facilitator help.

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
