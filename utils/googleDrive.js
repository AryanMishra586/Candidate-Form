const { google } = require("googleapis");

const auth = new google.auth.GoogleAuth({
  keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  scopes: ["https://www.googleapis.com/auth/drive.readonly"],
});

const drive = google.drive({ version: "v3", auth });

async function downloadFile(fileId) {
  try {
    const response = await drive.files.get(
      {
        fileId,
        alt: "media",
      },
      { responseType: "arraybuffer" }
    );

    return Buffer.from(response.data);
  } catch (error) {
    console.error("Google Drive download error:", error.message);
    return null;
  }
}

module.exports = { downloadFile };
