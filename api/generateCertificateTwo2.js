// api/generateCertificateTwo2.js

import { MongoClient, ObjectId } from 'mongodb';
import sharp from 'sharp';
import path from 'path';

// Environment variables
const uri = process.env.MONGODB_URI;
const dbName = 'Cluster0';
const collectionName = 'enrolled_students_tbl';

// Certificate image path
const CERTIFICATE_IMAGE_PATH = path.join(process.cwd(), 'public/images/full/wwee.jpg');

// Text styles and colors
const TEXT_COLOR_HEX = '#000000'; // Black
const WHITE_COLOR_HEX = '#FFFFFF'; // White

// Text positions (may need adjustment)
const TEXT_POSITIONS = {
  STUDENT_NAME: { x: 300, y: 150, fontSize: 48, color: WHITE_COLOR_HEX, alignment: 'middle' },
  SERIAL_NUMBER: { x: 90, y: 220, fontSize: 28, color: WHITE_COLOR_HEX, alignment: 'middle' },
  DOCUMENT_SERIAL_NUMBER: { x: 300, y: 280, fontSize: 20, color: TEXT_COLOR_HEX, alignment: 'middle' },
  PLATE_NUMBER: { x: 300, y: 320, fontSize: 20, color: TEXT_COLOR_HEX, alignment: 'middle' },
  CAR_TYPE: { x: 300, y: 360, fontSize: 20, color: TEXT_COLOR_HEX, alignment: 'middle' },
  COLOR: { x: 300, y: 400, fontSize: 20, color: TEXT_COLOR_HEX, alignment: 'middle' },
};

/**
 * Helper function to create an SVG text that can be composited onto the image.
 * @param {string} text - The text to display.
 * @param {number} fontSize - Font size in pixels.
 * @param {string} color - Text color (e.g., '#000000').
 * @param {number} imageWidth - The width of the base image to help determine SVG width.
 * @returns {Buffer} - A Buffer containing the SVG data.
 */
async function createTextSVG(text, fontSize, color, imageWidth) {
  const svgWidth = imageWidth;
  const svgHeight = fontSize * 1.5; // To provide enough space for the text

  const svg = `
    <svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" xmlns="http://www.w3.org/2000/svg">
      <style>
        /* Use a common system font to ensure compatibility in a Serverless environment */
        text {
          font-family: 'Arial', sans-serif;
          font-size: ${fontSize}px;
          fill: ${color};
          text-anchor: middle; /* For horizontal centering */
          dominant-baseline: central; /* For vertical centering */
        }
      </style>
      <text x="${svgWidth / 2}" y="${svgHeight / 2}">${text}</text>
    </svg>
  `;
  return Buffer.from(svg);
}

/**
 * Vercel Serverless Function to generate the certificate.
 * This function expects a GET request with a student ID in the path.
 *
 * @param {Object} request - The request object containing incoming request information.
 * @returns {Object} - The response object.
 */
export default async function handler(request) {
  // Extract the student ID from the request URL
  const studentId = request.url.split('/').pop();
  console.log('Received ID in generateCertificateTwo2:', studentId);

  let client;

  try {
    // Connect to MongoDB
    client = new MongoClient(uri);
    await client.connect();
    const database = client.db(dbName);
    const studentsCollection = database.collection(collectionName);

    let student;
    try {
      // Find the student by ObjectId
      student = await studentsCollection.findOne({ _id: new ObjectId(studentId) });
    } catch (objectIdError) {
      console.error('Error creating ObjectId:', objectIdError);
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid student ID' }),
        headers: { 'Content-Type': 'application/json' },
      };
    }

    // Check if the student exists
    if (!student) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: `Student not found with ID: ${studentId}` }),
        headers: { 'Content-Type': 'application/json' },
      };
    }

    // Extract student data
    const serialNumber = student.serial_number;
    const studentNameArabic