const supabase = require('../utils/supabase');
const PDFDocument = require('pdfkit');

async function generateCertificate(userId, lessonId) {
  try {
    // 1. Fetch Lesson details
    const { data: lesson } = await supabase
      .from('lessons')
      .select('title')
      .eq('id', lessonId)
      .single();

    if (!lesson) throw new Error('Lesson not found for certificate');

    const lessonTitle = lesson.title;
    // For a real app, fetch actual user details. For hackathon speed, use a masked ID.
    const userName = `Student ${userId.substring(0, 5)}`; 

    // 2. Generate PDF in memory buffer using pdfkit
    const pdfBuffer = await new Promise((resolve, reject) => {
      const doc = new PDFDocument({ layout: 'landscape', size: 'A4' });
      let buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // Draw PDF
      doc.rect(0, 0, doc.page.width, doc.page.height).fill('#f9fafb'); // light bg
      doc.fillColor('#1f2937').fontSize(40).text('Certificate of Completion', { align: 'center' });
      doc.moveDown();
      doc.fontSize(20).text('This certifies that', { align: 'center' });
      doc.moveDown();
      doc.fillColor('#2563eb').fontSize(35).text(userName, { align: 'center' });
      doc.moveDown();
      doc.fillColor('#1f2937').fontSize(20).text('has successfully completed the lesson', { align: 'center' });
      doc.moveDown();
      doc.fontSize(25).text(`"${lessonTitle}"`, { align: 'center' });
      doc.moveDown(2);
      doc.fontSize(15).text(`Issued on: ${new Date().toLocaleDateString()}`, { align: 'center' });
      
      doc.end();
    });

    // 3. Upload to Supabase Storage
    const bucketName = 'certificates';
    const filePath = `certificates/${userId}/${lessonId}-${Date.now()}.pdf`;

    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: false
      });

    if (uploadError) throw uploadError;

    // 4. Get Public URL
    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    const certificateUrl = publicUrlData.publicUrl;

    // 5. Save to database
    await supabase
      .from('certificates')
      .insert({
        user_id: userId,
        lesson_id: lessonId,
        certificate_url: certificateUrl
      });

    return certificateUrl;
  } catch (error) {
    console.error('Error generating certificate:', error);
    // Suppress error so it doesn't crash the quiz submission cascade
  }
}

module.exports = { generateCertificate };
