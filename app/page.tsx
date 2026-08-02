"use client";

import PublicLayout from "./public-site/layout";
import PublicHomePage from "./public-site/page";

export default function RootHomePage() {
  return (
    <PublicLayout>
      <PublicHomePage />
    </PublicLayout>
  );
}
