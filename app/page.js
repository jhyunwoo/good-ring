"use client";

import goodRing from "@/lib/goodRing";

export default function Home() {
  const result = goodRing();
  console.log(result);
  return <div></div>;
}
