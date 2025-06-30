// File: functions/setRoles.js
const admin = require('firebase-admin');
// Yêu cầu: Đặt file serviceAccountKey.json của CEO vào thư mục functions
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const userEmail = 'admin@ivs.edu.vn'; // Email của tài khoản cần gán quyền
const customClaims = { role: 'principal' }; // 'principal', 'teacher', hoặc 'parent'

async function setCustomUserClaims() {
  try {
    const user = await admin.auth().getUserByEmail(userEmail);
    await admin.auth().setCustomUserClaims(user.uid, customClaims);
    console.log(`Successfully set role '${customClaims.role}' for user ${userEmail}`);
  } catch (error) {
    console.log('Error setting custom claims:', error);
  }
  process.exit();
}

setCustomUserClaims();
