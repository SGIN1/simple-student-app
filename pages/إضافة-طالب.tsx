"use client"

import type React from "react"

import { useState } from "react"
import Head from "next/head"
import Link from "next/link"
import { useRouter } from "next/router"

export default function إضافة_طالب() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState<"success" | "error" | "">("")

  const [formData, setFormData] = useState({
    serial_number: "",
    residency_number: "",
    document_serial_number: "",
    plate_number: "",
    inspection_date: "",
    manufacturer: "",
    inspection_expiry_date: "",
    car_type: "",
    counter_reading: "",
    chassis_number: "",
    vehicle_model: "",
    color: "",
    serial_number_duplicate: "",
    arabic_name: "",
  })

  const calculateExpiryDate = (inspectionDate: string) => {
    if (!inspectionDate) return ""

    const date = new Date(inspectionDate)
    date.setFullYear(date.getFullYear() + 1)

    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, "0")
    const day = date.getDate().toString().padStart(2, "0")

    return `${year}-${month}-${day}`
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))

    // حساب تاريخ انتهاء الفحص تلقائياً
    if (name === "inspection_date") {
      setFormData((prev) => ({
        ...prev,
        inspection_expiry_date: calculateExpiryDate(value),
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.serial_number || !formData.residency_number) {
      setMessage("الرقم التسلسلي ورقم الإقامة مطلوبان")
      setMessageType("error")
      return
    }

    setLoading(true)
    setMessage("جاري إضافة الطالب...")
    setMessageType("")

    try {
      const response = await fetch("/api/addStudent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage(data.message || "تمت إضافة الطالب بنجاح! سيتم نقلك لصفحة البيانات.")
        setMessageType("success")

        // إعادة تعيين النموذج
        setFormData({
          serial_number: "",
          residency_number: "",
          document_serial_number: "",
          plate_number: "",
          inspection_date: "",
          manufacturer: "",
          inspection_expiry_date: "",
          car_type: "",
          counter_reading: "",
          chassis_number: "",
          vehicle_model: "",
          color: "",
          serial_number_duplicate: "",
          arabic_name: "",
        })

        // الانتقال لصفحة البيانات بعد 2 ثانية
        setTimeout(() => {
          router.push("/بيانات-الطلاب")
        }, 2000)
      } else {
        setMessage(data.error || "حدث خطأ أثناء محاولة إضافة الطالب.")
        setMessageType("error")
      }
    } catch (error) {
      console.error("خطأ في إضافة الطالب:", error)
      setMessage("حدث خطأ غير متوقع أثناء إضافة الطالب.")
      setMessageType("error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>إضافة طالب جديد</title>
        <meta charSet="UTF-8" />
        <link rel="stylesheet" href="/القالب_المشترك.css" />
      </Head>

      <header style={{ position: "relative" }}>
        <div className="container">
          <h1>إضافة طالب جديد</h1>
          <div className="back-link">
            <Link href="/بيانات-الطلاب">العودة إلى صفحة الطلاب</Link>
          </div>
        </div>
      </header>

      <div className="container">
        <h1>إضافة طالب جديد</h1>

        <form onSubmit={handleSubmit}>
          <label htmlFor="serial_number">الرقم التسلسلي: *</label>
          <input
            type="text"
            id="serial_number"
            name="serial_number"
            value={formData.serial_number}
            onChange={handleInputChange}
            required
            disabled={loading}
          />

          <label htmlFor="residency_number">رقم الإقامة: *</label>
          <input
            type="text"
            id="residency_number"
            name="residency_number"
            value={formData.residency_number}
            onChange={handleInputChange}
            required
            disabled={loading}
          />

          <label htmlFor="arabic_name">الاسم العربي:</label>
          <input
            type="text"
            id="arabic_name"
            name="arabic_name"
            value={formData.arabic_name}
            onChange={handleInputChange}
            placeholder="أدخل الاسم باللغة العربية"
            disabled={loading}
          />

          <label htmlFor="document_serial_number">الرقم التسلسلي للوثيقة:</label>
          <input
            type="text"
            id="document_serial_number"
            name="document_serial_number"
            value={formData.document_serial_number}
            onChange={handleInputChange}
            disabled={loading}
          />

          <label htmlFor="plate_number">رقم اللوحة:</label>
          <input
            type="text"
            id="plate_number"
            name="plate_number"
            value={formData.plate_number}
            onChange={handleInputChange}
            disabled={loading}
          />

          <label htmlFor="inspection_date">تاريخ الفحص:</label>
          <input
            type="date"
            id="inspection_date"
            name="inspection_date"
            value={formData.inspection_date}
            onChange={handleInputChange}
            disabled={loading}
          />

          <label htmlFor="manufacturer">الشركة الصانعة:</label>
          <input
            type="text"
            id="manufacturer"
            name="manufacturer"
            value={formData.manufacturer}
            onChange={handleInputChange}
            disabled={loading}
          />

          <label htmlFor="inspection_expiry_date">تاريخ انتهاء الفحص:</label>
          <input
            type="date"
            id="inspection_expiry_date"
            name="inspection_expiry_date"
            value={formData.inspection_expiry_date}
            onChange={handleInputChange}
            disabled={loading}
          />

          <label htmlFor="car_type">نوع السيارة:</label>
          <input
            type="text"
            id="car_type"
            name="car_type"
            value={formData.car_type}
            onChange={handleInputChange}
            disabled={loading}
          />

          <label htmlFor="counter_reading">قراءة العداد:</label>
          <input
            type="number"
            id="counter_reading"
            name="counter_reading"
            value={formData.counter_reading}
            onChange={handleInputChange}
            disabled={loading}
          />

          <label htmlFor="chassis_number">رقم الهيكل:</label>
          <input
            type="text"
            id="chassis_number"
            name="chassis_number"
            value={formData.chassis_number}
            onChange={handleInputChange}
            disabled={loading}
          />

          <label htmlFor="vehicle_model">طراز المركبة:</label>
          <input
            type="text"
            id="vehicle_model"
            name="vehicle_model"
            value={formData.vehicle_model}
            onChange={handleInputChange}
            disabled={loading}
          />

          <label htmlFor="color">اللون:</label>
          <input
            type="text"
            id="color"
            name="color"
            value={formData.color}
            onChange={handleInputChange}
            disabled={loading}
          />

          <label htmlFor="serial_number_duplicate">الرقم التسلسلي (مكرر):</label>
          <input
            type="text"
            id="serial_number_duplicate"
            name="serial_number_duplicate"
            value={formData.serial_number_duplicate}
            onChange={handleInputChange}
            disabled={loading}
          />

          <button type="submit" className="add-button" disabled={loading}>
            {loading ? "جاري الإضافة..." : "إضافة"}
          </button>
        </form>

        {message && (
          <div
            className={`message ${messageType}`}
            style={{
              padding: "10px",
              margin: "10px 0",
              borderRadius: "5px",
              backgroundColor: messageType === "success" ? "#d4edda" : "#f8d7da",
              color: messageType === "success" ? "#155724" : "#721c24",
              border: `1px solid ${messageType === "success" ? "#c3e6cb" : "#f5c6cb"}`,
            }}
          >
            {message}
          </div>
        )}

        <div className="back-link">
          <Link href="/بيانات-الطلاب">الرجوع إلى صفحة البيانات</Link>
        </div>
      </div>

      <footer>
        <div className="container">جميع الحقوق محفوظة - البوابة الوطنية الداعمة للمجتمع البلدي © 2023</div>
      </footer>
    </>
  )
}

