"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Head from "next/head"
import Link from "next/link"
import { useRouter } from "next/router"

interface Student {
  id: string
  serial_number: string
  residency_number: string
  document_serial_number?: string
  plate_number?: string
  inspection_date?: string
  manufacturer?: string
  inspection_expiry_date?: string
  car_type?: string
  counter_reading?: string
  chassis_number?: string
  vehicle_model?: string
  color?: string
  serial_number_duplicate?: string
  arabic_name?: string
}

export default function تعديل_طالب() {
  const router = useRouter()
  const { id } = router.query

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

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

  const fetchStudentData = async (studentId: string) => {
    try {
      setLoading(true)
      setError("")

      const response = await fetch(`/api/getStudent?id=${studentId}`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const student: Student = await response.json()

      setFormData({
        serial_number: student.serial_number || "",
        residency_number: student.residency_number || "",
        document_serial_number: student.document_serial_number || "",
        plate_number: student.plate_number || "",
        inspection_date: student.inspection_date || "",
        manufacturer: student.manufacturer || "",
        inspection_expiry_date: student.inspection_expiry_date || "",
        car_type: student.car_type || "",
        counter_reading: student.counter_reading || "",
        chassis_number: student.chassis_number || "",
        vehicle_model: student.vehicle_model || "",
        color: student.color || "",
        serial_number_duplicate: student.serial_number_duplicate || "",
        arabic_name: student.arabic_name || "",
      })
    } catch (error) {
      console.error("خطأ في جلب بيانات الطالب:", error)
      setError("حدث خطأ أثناء محاولة جلب بيانات الطالب.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id && typeof id === "string") {
      fetchStudentData(id)
    } else if (router.isReady && !id) {
      setError("لم يتم توفير مُعرّف الطالب لتعديله.")
      setLoading(false)
    }
  }, [id, router.isReady])

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
      setError("الرقم التسلسلي ورقم الإقامة مطلوبان")
      return
    }

    setSaving(true)
    setError("")

    try {
      const response = await fetch("/api/updateStudent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          ...formData,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        alert("تم تحديث بيانات الطالب بنجاح!")
        router.push("/بيانات-الطلاب")
      } else {
        setError(data.error || "حدث خطأ أثناء تحديث بيانات الطالب.")
      }
    } catch (error) {
      console.error("خطأ في تحديث الطالب:", error)
      setError("حدث خطأ غير متوقع أثناء تحديث بيانات الطالب.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <>
        <Head>
          <title>تعديل بيانات الطالب - جاري التحميل</title>
          <meta charSet="UTF-8" />
        </Head>
        <div style={{ textAlign: "center", padding: "50px", fontFamily: "Arial, sans-serif" }}>
          <h2>جاري تحميل بيانات الطالب...</h2>
        </div>
      </>
    )
  }

  if (error && !formData.serial_number) {
    return (
      <>
        <Head>
          <title>تعديل بيانات الطالب - خطأ</title>
          <meta charSet="UTF-8" />
        </Head>
        <div style={{ textAlign: "center", padding: "50px", fontFamily: "Arial, sans-serif" }}>
          <h2 style={{ color: "red" }}>خطأ</h2>
          <p>{error}</p>
          <Link href="/بيانات-الطلاب" style={{ color: "#007bff", textDecoration: "none" }}>
            العودة إلى صفحة البيانات
          </Link>
        </div>
      </>
    )
  }

  return (
    <>
      <Head>
        <title>تعديل بيانات الطالب</title>
        <meta charSet="UTF-8" />
        <link rel="stylesheet" href="/القالب_المشترك.css" />
      </Head>

      <header style={{ position: "relative" }}>
        <div className="container">
          <h1>تعديل بيانات الطالب</h1>
          <div className="back-link">
            <Link href="/بيانات-الطلاب">العودة إلى صفحة الطلاب</Link>
          </div>
        </div>
      </header>

      <div className="container">
        <h1>تعديل بيانات الطالب</h1>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="serial_number">الرقم التسلسلي: *</label>
            <input
              type="text"
              id="serial_number"
              name="serial_number"
              value={formData.serial_number}
              onChange={handleInputChange}
              required
              disabled={saving}
            />
          </div>

          <div className="form-group">
            <label htmlFor="residency_number">رقم الإقامة: *</label>
            <input
              type="text"
              id="residency_number"
              name="residency_number"
              value={formData.residency_number}
              onChange={handleInputChange}
              required
              disabled={saving}
            />
          </div>

          <div className="form-group">
            <label htmlFor="arabic_name">الاسم العربي:</label>
            <input
              type="text"
              id="arabic_name"
              name="arabic_name"
              value={formData.arabic_name}
              onChange={handleInputChange}
              placeholder="أدخل الاسم باللغة العربية"
              disabled={saving}
            />
          </div>

          <div className="form-group">
            <label htmlFor="document_serial_number">الرقم التسلسلي للوثيقة:</label>
            <input
              type="text"
              id="document_serial_number"
              name="document_serial_number"
              value={formData.document_serial_number}
              onChange={handleInputChange}
              disabled={saving}
            />
          </div>

          <div className="form-group">
            <label htmlFor="plate_number">رقم اللوحة:</label>
            <input
              type="text"
              id="plate_number"
              name="plate_number"
              value={formData.plate_number}
              onChange={handleInputChange}
              disabled={saving}
            />
          </div>

          <div className="form-group">
            <label htmlFor="inspection_date">تاريخ الفحص:</label>
            <input
              type="date"
              id="inspection_date"
              name="inspection_date"
              value={formData.inspection_date}
              onChange={handleInputChange}
              disabled={saving}
            />
          </div>

          <div className="form-group">
            <label htmlFor="manufacturer">الشركة الصانعة:</label>
            <input
              type="text"
              id="manufacturer"
              name="manufacturer"
              value={formData.manufacturer}
              onChange={handleInputChange}
              disabled={saving}
            />
          </div>

          <div className="form-group">
            <label htmlFor="inspection_expiry_date">تاريخ انتهاء الفحص:</label>
            <input
              type="date"
              id="inspection_expiry_date"
              name="inspection_expiry_date"
              value={formData.inspection_expiry_date}
              onChange={handleInputChange}
              disabled={saving}
            />
          </div>

          <div className="form-group">
            <label htmlFor="car_type">نوع السيارة:</label>
            <input
              type="text"
              id="car_type"
              name="car_type"
              value={formData.car_type}
              onChange={handleInputChange}
              disabled={saving}
            />
          </div>

          <div className="form-group">
            <label htmlFor="counter_reading">قراءة العداد:</label>
            <input
              type="number"
              id="counter_reading"
              name="counter_reading"
              value={formData.counter_reading}
              onChange={handleInputChange}
              disabled={saving}
            />
          </div>

          <div className="form-group">
            <label htmlFor="chassis_number">رقم الهيكل:</label>
            <input
              type="text"
              id="chassis_number"
              name="chassis_number"
              value={formData.chassis_number}
              onChange={handleInputChange}
              disabled={saving}
            />
          </div>

          <div className="form-group">
            <label htmlFor="vehicle_model">طراز المركبة:</label>
            <input
              type="text"
              id="vehicle_model"
              name="vehicle_model"
              value={formData.vehicle_model}
              onChange={handleInputChange}
              disabled={saving}
            />
          </div>

          <div className="form-group">
            <label htmlFor="color">اللون:</label>
            <input
              type="text"
              id="color"
              name="color"
              value={formData.color}
              onChange={handleInputChange}
              disabled={saving}
            />
          </div>

          <div className="form-group">
            <label htmlFor="serial_number_duplicate">الرقم التسلسلي (مكرر):</label>
            <input
              type="text"
              id="serial_number_duplicate"
              name="serial_number_duplicate"
              value={formData.serial_number_duplicate}
              onChange={handleInputChange}
              disabled={saving}
            />
          </div>

          <div className="form-group">
            <button type="submit" disabled={saving}>
              {saving ? "جاري الحفظ..." : "حفظ التعديلات"}
            </button>
          </div>

          {error && (
            <div
              className="error-message"
              style={{
                padding: "10px",
                margin: "10px 0",
                borderRadius: "5px",
                backgroundColor: "#f8d7da",
                color: "#721c24",
                border: "1px solid #f5c6cb",
              }}
            >
              {error}
            </div>
          )}
        </form>
      </div>

      <footer>
        <div className="container">جميع الحقوق محفوظة - البوابة الوطنية الداعمة للمجتمع البلدي © 2023</div>
      </footer>
    </>
  )
}
