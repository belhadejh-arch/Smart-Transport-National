import { ScrollViewStyleReset } from "expo-router/html";
import type { PropsWithChildren } from "react";

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />

        <title>NQL DZ — منصة النقل الذكية في الجزائر</title>

        <meta
          name="description"
          content="NQL DZ — المنصة الوطنية الذكية للنقل في الجزائر. ادفع رحلاتك ببطاقة QR ذكية، تابع رصيدك، واشحن من أقرب موزع. حلول متكاملة للسائقين، الزبائن، والموزعين."
        />
        <meta
          name="keywords"
          content="NQL DZ, نقل الجزائر, بطاقة QR, نقل ذكي, دفع النقل, transport algerie, smart transit, QR card"
        />
        <meta name="author" content="NQL DZ" />
        <meta name="robots" content="index, follow" />
        <meta name="theme-color" content="#2C6B7F" />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="NQL DZ" />
        <meta property="og:title" content="NQL DZ — منصة النقل الذكية في الجزائر" />
        <meta
          property="og:description"
          content="ادفع رحلاتك ببطاقة QR ذكية، تابع رصيدك، واشحن من أقرب موزع. حلول نقل متكاملة للسائقين، الزبائن، والموزعين في الجزائر."
        />
        <meta property="og:locale" content="ar_DZ" />
        <meta property="og:url" content="https://nqldz.xyz" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="NQL DZ — منصة النقل الذكية في الجزائر" />
        <meta
          name="twitter:description"
          content="بطاقة QR ذكية للنقل في الجزائر — للسائقين والزبائن والموزعين."
        />

        <link rel="canonical" href="https://nqldz.xyz" />

        <ScrollViewStyleReset />

        <style dangerouslySetInnerHTML={{ __html: responsiveBackground }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

const responsiveBackground = `
body { background-color: #fff; }
@media (prefers-color-scheme: dark) {
  body { background-color: #0a0a0a; }
}
`;
