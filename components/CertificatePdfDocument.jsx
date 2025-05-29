// components/CertificatePdfDocument.jsx
import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font, Image } from '@react-pdf/renderer';

Font.register({
  family: 'ArialCustom', // اسم الخط الذي ستستخدمه في خاصية fontFamily
  src: '/fonts/arial.ttf', // المسار إلى ملف الخط داخل مجلد 'public'
});

const styles = StyleSheet.create({
  page: {
    size: "A4",
    orientation: "landscape",
    backgroundColor: '#FFFFFF',
    padding: 0,
  },
  container: {
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  backgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    left: 0,
    top: 0,
  },
  studentName: {
    position: 'absolute',
    top: '40%',
    left: '0%',
    width: '100%',
    textAlign: 'center',
    fontSize: 36,
    fontFamily: 'ArialCustom',
    color: '#000000',
  },
  serialNumber: {
    position: 'absolute',
    top: '15%',
    left: '10%',
    width: '30%',
    textAlign: 'left',
    fontSize: 16,
    fontFamily: 'ArialCustom',
    color: '#FFFFFF',
  },
  documentSerialNumber: {
    position: 'absolute',
    top: '55%',
    left: '0%',
    width: '100%',
    textAlign: 'center',
    fontSize: 16,
    fontFamily: 'ArialCustom',
    color: '#000000',
  },
  plateNumber: {
    position: 'absolute',
    top: '60%',
    left: '0%',
    width: '100%',
    textAlign: 'center',
    fontSize: 16,
    fontFamily: 'ArialCustom',
    color: '#000000',
  },
  carType: {
    position: 'absolute',
    top: '65%',
    left: '0%',
    width: '100%',
    textAlign: 'center',
    fontSize: 16,
    fontFamily: 'ArialCustom',
    color: '#000000',
  },
  color: {
    position: 'absolute',
    top: '70%',
    left: '0%',
    width: '100%',
    textAlign: 'center',
    fontSize: 16,
    fontFamily: 'ArialCustom',
    color: '#000000',
  },
});

const CertificatePdfDocument = ({ studentData, absoluteImagePath }) => (
  <Document>
    <Page size="A4" orientation="landscape" style={styles.page}>
      <View style={styles.container}>
        <Image src={absoluteImagePath} style={styles.backgroundImage} />

        <Text style={styles.studentName}>{studentData.arabic_name || 'اسم غير معروف'}</Text>
        <Text style={styles.serialNumber}>{studentData.serial_number || 'غير متوفر'}</Text>
        <Text style={styles.documentSerialNumber}>{studentData.document_serial_number || 'غير متوفر'}</Text>
        <Text style={styles.plateNumber}>{studentData.plate_number || 'غير متوفر'}</Text>
        <Text style={styles.carType}>{studentData.car_type || 'غير متوفر'}</Text>
        <Text style={styles.color}>{studentData.color || 'غير متوفر'}</Text>
      </View>
    </Page>
  </Document>
);

export default CertificatePdfDocument;