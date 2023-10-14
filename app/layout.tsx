import RecoilWrapper from "@/components/recoil-wrapper";
import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Beauty of Math",
  description:
    "서울대생이 흥분한 인접한 수의 합이 모두 제곱수인 자연수 원형 배열 찾기",
  openGraph: {
    title: "Beauty of Math",
    description: "인접한 수의 합이 모두 제곱수인 자연수 원형 배열 찾기",
    type: "website",
    images: ["/og-image.jpg"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <RecoilWrapper>{children}</RecoilWrapper>
      </body>
    </html>
  );
}
