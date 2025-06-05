"use client"

import { useEffect } from "react"
import { useRouter } from "next/router"

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // توجيه فوري لصفحة بيانات الطلاب
    router.replace("/بيانات-الطلاب")
  }, [router])

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        fontFamily: "Arial, sans-serif",
        direction: "rtl",
        fontSize: "18px",
        color: "#333",
      }}
    >
      جاري التحميل...
    </div>
  )
}
