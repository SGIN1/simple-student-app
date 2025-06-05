"use client"

import type React from "react"

import { useEffect, useState } from "react"
import Head from "next/head"
import Link from "next/link"

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
  created_at: string
  arabic_name?: string
}

export default function بيانات_الطلاب() {
  const [students, setStudents] = useState<Student[]>([])
  const [allStudents, setAllStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  const fetchStudents = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/getStudent")

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (Array.isArray(data)) {
        setAllStudents(data)
        setStudents(data)
      } else {
        throw new Error("البيانات المستلمة ليست في الشكل المتوقع")
      }
    } catch (error) {
      console.error("خطأ في جلب بيانات الطلاب:", error)
      setError("حدث خطأ أثناء محاولة تحميل بيانات الطلاب. يرجى المحاولة مرة أخرى.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStudents()
  }, [])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchTerm(value)

    if (value.trim() === "") {
      setStudents(allStudents)
    } else {
      const filtered = allStudents.filter((student) => student.residency_number.includes(value.trim()))
      setStudents(filtered)
    }
  }

  const deleteStudent = async (studentId: string) => {
    if (!confirm("هل أنت متأكد أنك تريد حذف هذا الطالب؟")) {
      return
    }

    try {
      const response = await fetch("/api/deleteStudent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: studentId }),
      })

      const data = await response.json()

      if (response.ok) {
        alert(data.message || "تم حذف الطالب بنجاح!")
        fetchStudents()
      } else {
        alert(data.error || "حدث خطأ أثناء محاولة حذف الطالب.")
      }
    } catch (error) {
      console.error("خطأ في عملية الحذف:", error)
      alert("حدث خطأ غير متوقع أثناء الحذف.")
    }
  }

  const showCertificate = (url: string) => {
    window.open(url, "_blank")
  }

  if (loading) {
    return (
      <>
        <Head>
          <title>بيانات الطلاب - جاري التحميل</title>
          <meta charSet="UTF-8" />
        </Head>
        <div style={{ textAlign: "center", padding: "50px", fontFamily: "Arial, sans-serif" }}>
          <h2>جاري تحميل بيانات الطلاب...</h2>
          <div
            style={{
              border: "4px solid #f3f3f3",
              borderTop: "4px solid #3498db",
              borderRadius: "50%",
              width: "40px",
              height: "40px",
              animation: "spin 2s linear infinite",
              margin: "20px auto",
            }}
          ></div>
          <style jsx>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </>
    )
  }

  if (error) {
    return (
      <>
        <Head>
          <title>بيانات الطلاب - خطأ</title>
          <meta charSet="UTF-8" />
        </Head>
        <div style={{ textAlign: "center", padding: "50px", fontFamily: "Arial, sans-serif" }}>
          <h2 style={{ color: "red" }}>خطأ في تحميل البيانات</h2>
          <p>{error}</p>
          <button
            onClick={fetchStudents}
            style={{
              padding: "10px 20px",
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              fontSize: "16px",
            }}
          >
            إعادة المحاولة
          </button>
        </div>
      </>
    )
  }

  return (
    <>
      <Head>
        <title>بيانات الطلاب</title>
        <meta charSet="UTF-8" />
        <link rel="stylesheet" href="/القالب_المشترك2.css" />
      </Head>

      <div className="container">
        <h1>بيانات الطلاب</h1>

        <div className="add-new">
          <Link href="/إضافة-طالب">إصدار جديد</Link>
        </div>

        <div className="search-form">
          <input type="text" value={searchTerm} onChange={handleSearch} placeholder="ابحث برقم الإقامة" />
        </div>

        {students.length === 0 && searchTerm && <p className="no-results">لا يوجد طلاب بهذا الرقم للإقامة.</p>}

        {students.length === 0 && !searchTerm && <p className="no-results">لا يوجد أي طلاب مسجلين.</p>}

        {students.length > 0 && (
          <table id="students_table">
            <thead>
              <tr>
                <th>المعرف</th>
                <th>الرقم التسلسلي</th>
                <th>رقم الإقامة</th>
                <th>الرقم التسلسلي للوثيقة</th>
                <th>رقم اللوحة</th>
                <th>تاريخ الفحص</th>
                <th>الشركة الصانعة</th>
                <th>تاريخ انتهاء الفحص</th>
                <th>نوع السيارة</th>
                <th>قراءة العداد</th>
                <th>رقم الهيكل</th>
                <th>طراز المركبة</th>
                <th>اللون</th>
                <th>الرقم التسلسلي (مكرر)</th>
                <th>تاريخ الإضافة</th>
                <th>تعديل</th>
                <th>حذف</th>
                <th>عرض الشهادة الأولى</th>
                <th>عرض الشهادة الثانية</th>
              </tr>
            </thead>
            <tbody>
              {[...students].reverse().map((student) => (
                <tr key={student.id}>
                  <td>{student.id}</td>
                  <td>{student.serial_number}</td>
                  <td>{student.residency_number}</td>
                  <td>{student.document_serial_number || ""}</td>
                  <td>{student.plate_number || ""}</td>
                  <td>{student.inspection_date || ""}</td>
                  <td>{student.manufacturer || ""}</td>
                  <td>{student.inspection_expiry_date || ""}</td>
                  <td>{student.car_type || ""}</td>
                  <td>{student.counter_reading || ""}</td>
                  <td>{student.chassis_number || ""}</td>
                  <td>{student.vehicle_model || ""}</td>
                  <td>{student.color || ""}</td>
                  <td>{student.serial_number_duplicate || ""}</td>
                  <td>{student.created_at}</td>
                  <td className="actions">
                    <Link href={`/تعديل-طالب?id=${student.id}`} className="edit-btn">
                      تعديل
                    </Link>
                  </td>
                  <td className="actions">
                    <button className="delete-btn" onClick={() => deleteStudent(student.id)}>
                      حذف
                    </button>
                  </td>
                  <td>
                    <button
                      className="print-btn"
                      onClick={() => showCertificate(`/api/generateCertificateOne1?id=${student.id}`)}
                    >
                      عرض الأولى
                    </button>
                  </td>
                  <td>
                    <button
                      className="print-btn"
                      onClick={() => showCertificate(`/api/generateCertificateTwo2?id=${student.id}`)}
                    >
                      عرض الثانية
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}
