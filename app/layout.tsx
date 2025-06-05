import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "نظام إدارة الطلاب",
  description: "نظام إدارة الطلاب مع إنشاء الشهادات",
  charset: "UTF-8",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body>{children}</body>
    </html>
  )
}
