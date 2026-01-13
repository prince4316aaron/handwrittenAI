import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { onObjectFinalized } from "firebase-functions/v2/storage";
import * as nodemailer from "nodemailer";

// pdf-parse MUST be required (CommonJS)
const pdfParse = require("pdf-parse");

// Initialize Firebase Admin once
admin.initializeApp();

// =========================================================
// 1️⃣ EXISTING PDF PROCESSOR (FIXED)
// =========================================================
export const processMasterlist = onObjectFinalized(
  { cpu: 2 },
  async (event) => {
    const fileBucket = event.data.bucket;
    const filePath = event.data.name;
    const contentType = event.data.contentType;

    // Validate file
    if (
      !filePath ||
      !filePath.startsWith("masterlists/") ||
      !contentType?.startsWith("application/pdf")
    ) {
      logger.info("File is not a masterlist PDF.");
      return;
    }

    const parts = filePath.split("/");
    if (parts.length < 4) {
      logger.error("Invalid file path structure:", filePath);
      return;
    }

    const professorId = parts[1];
    const classId = parts[2];

    const bucket = admin.storage().bucket(fileBucket);

    try {
      const [buffer] = await bucket.file(filePath).download();
      const pdfData = await pdfParse(buffer);
      const text: string = pdfData.text || "";
      const lines = text.split("\n");

      const students: Record<string, any> = {};
      const STUDENT_ID_REGEX = /(TUPM-\d{2}-\d{4})(.*)$/i;

      for (const line of lines) {
        const match = line.match(STUDENT_ID_REGEX);
        if (!match) continue;

        const studentId = match[1].trim();
        let remainder = match[2].trim();

        // Remove numbering "1."
        remainder = remainder.replace(/^\d+\./, "").trim();

        // 🔹 FIX: Removed the leading '\b' so it catches "NameBSCS" (merged text)
        // It now looks for these codes at the end of the string.
        remainder = remainder.replace(
          /(BSCS|BSIT|BSECE|BIT|BET|BSEE|BSME|BSCE|BSA|BSBA|BSTM|BSHM|BSENT).*$/i,
          ""
        ).trim();

        if (remainder.length < 4) continue;

        students[studentId] = {
          studentId,
          name: remainder,
          addedAt: new Date().toISOString(),
        };
      }

      const studentCount = Object.keys(students).length;
      logger.info(`Parsed ${studentCount} students from PDF.`);

      if (studentCount > 0) {
        const dbRef = admin
          .database()
          .ref(`professors/${professorId}/classes/${classId}/students`);

        await dbRef.update(students);
        logger.info(`Successfully added ${studentCount} students for class ${classId}.`);
      } else {
        logger.warn("No students found in PDF parsing.");
      }
    } catch (error) {
      logger.error("Error processing masterlist:", error);
    }
  }
);

// =========================================================
// 4️⃣ VERIFY PERSONAL EMAIL OTP (Callable)
// =========================================================
export const verifyPersonalEmail = onCall(async (request) => {
  const { email, otp } = request.data;
  const uid = request.auth?.uid; // Securely get the logged-in user's ID

  if (!uid) {
    throw new HttpsError('unauthenticated', 'User must be logged in.');
  }
  if (!email || !otp) {
    throw new HttpsError('invalid-argument', 'Missing fields');
  }

  const sanitizedEmail = email.replace(/\./g, ',');
  const otpRef = admin.database().ref(`otps/${sanitizedEmail}`);

  try {
    const snapshot = await otpRef.get();
    
    if (!snapshot.exists()) {
      throw new HttpsError('not-found', 'Invalid code');
    }

    const data = snapshot.val();

    if (data.otp !== otp) {
      throw new HttpsError('invalid-argument', 'Incorrect code');
    }

    if (Date.now() > data.expiresAt) {
      throw new HttpsError('deadline-exceeded', 'Code expired');
    }

    // ✅ OTP is valid! Mark personal email as verified in DB
    await admin.database().ref(`professors/${uid}`).update({
      personalEmailVerified: true
    });

    // Cleanup
    await otpRef.remove();

    return { success: true, message: "Personal email verified successfully" };

  } catch (error: any) {
    logger.error("Verify Email Error:", error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError('internal', 'Failed to verify email');
  }
});

// =========================================================
// 2️⃣ SEND OTP EMAIL (Callable)
// =========================================================
export const sendOtpEmail = onCall(async (request) => {
  const email = request.data.email;
  
  if (!email) {
    throw new HttpsError('invalid-argument', 'Email is required');
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  try {
    const sanitizedEmail = email.replace(/\./g, ',');
    await admin.database().ref(`otps/${sanitizedEmail}`).set({
      otp: otp,
      expiresAt: Date.now() + 10 * 60 * 1000 
    });

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'handwrittenai@gmail.com',
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });

    await transporter.sendMail({
      from: 'Handwritten AI App <handwrittenai@gmail.com>',
      to: email,
      subject: 'Password Reset Code',
      text: `Your verification code is: ${otp}. It expires in 10 minutes.`
    });

    return { success: true, message: "OTP sent successfully" };

  } catch (error: any) {
    logger.error("Error sending OTP:", error);
    throw new HttpsError('internal', 'Failed to send email.');
  }
});

// =========================================================
// 3️⃣ VERIFY OTP & RESET PASSWORD (Callable)
// =========================================================
export const resetPasswordWithOtp = onCall(async (request) => {
  const { email, otp, newPassword } = request.data;

  if (!email || !otp || !newPassword) {
    throw new HttpsError('invalid-argument', 'Missing fields');
  }

  const sanitizedEmail = email.replace(/\./g, ',');
  const otpRef = admin.database().ref(`otps/${sanitizedEmail}`);

  try {
    const snapshot = await otpRef.get();
    
    if (!snapshot.exists()) {
      throw new HttpsError('not-found', 'Invalid code');
    }

    const data = snapshot.val();

    if (data.otp !== otp) {
      throw new HttpsError('invalid-argument', 'Incorrect code');
    }

    if (Date.now() > data.expiresAt) {
      throw new HttpsError('deadline-exceeded', 'Code expired');
    }

    const userRecord = await admin.auth().getUserByEmail(email);
    await admin.auth().updateUser(userRecord.uid, {
      password: newPassword
    });

    await otpRef.remove();

    return { success: true, message: "Password updated successfully" };

  } catch (error: any) {
    logger.error("Reset Password Error:", error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError('internal', 'Failed to reset password');
  }
});