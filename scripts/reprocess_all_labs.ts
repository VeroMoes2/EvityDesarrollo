import { db } from '../server/db';
import { medicalDocuments, labAnalytes } from '../shared/schema';
import { eq } from 'drizzle-orm';
import axios from 'axios';
import FormData from 'form-data';

async function reprocessLabDocuments() {
  console.log('Starting lab document reprocessing (including deleted)...');
  
  // Get ALL lab documents including deleted ones
  const docs = await db
    .select({
      id: medicalDocuments.id,
      userId: medicalDocuments.userId,
      originalName: medicalDocuments.originalName,
      mimeType: medicalDocuments.mimeType,
      fileData: medicalDocuments.fileData,
      deletedAt: medicalDocuments.deletedAt,
    })
    .from(medicalDocuments)
    .where(eq(medicalDocuments.fileType, 'lab'));

  console.log(`Found ${docs.length} lab documents to process`);

  let totalAnalytesSaved = 0;

  for (const doc of docs) {
    if (!doc.fileData) {
      console.log(`Skipping ${doc.originalName}: No file data`);
      continue;
    }

    try {
      console.log(`Processing: ${doc.originalName} (deleted: ${doc.deletedAt ? 'yes' : 'no'})`);
      
      const fileBuffer = Buffer.from(doc.fileData, 'base64');
      const form = new FormData();
      form.append('file', fileBuffer, {
        filename: doc.originalName,
        contentType: doc.mimeType || 'application/pdf',
      });

      const response = await axios.post(
        'http://localhost:5001/labs/ocr',
        form,
        { headers: form.getHeaders() }
      );

      const ocrResult = response.data;
      const analytesCount = ocrResult.parsed?.analitos?.length || 0;
      console.log(`OCR result for ${doc.originalName}: ${analytesCount} analytes found`);

      if (analytesCount > 0) {
        console.log('Analytes found:', JSON.stringify(ocrResult.parsed.analitos.slice(0, 3), null, 2));
        
        for (const a of ocrResult.parsed.analitos) {
          let collectedDate: Date | null = null;
          if (a.fecha) {
            const parsed = new Date(a.fecha);
            if (!isNaN(parsed.getTime())) {
              collectedDate = parsed;
            }
          }

          await db.insert(labAnalytes).values({
            userId: doc.userId,
            analyteName: a.nombre || 'Desconocido',
            valueNumeric: String(a.valor),
            unit: a.unidad || '',
            collectedAt: collectedDate,
            sourceDocumentId: doc.id,
          });
          totalAnalytesSaved++;
        }
        console.log(`Saved ${analytesCount} analytes for ${doc.originalName}`);
      }
    } catch (error: any) {
      console.error(`Error processing ${doc.originalName}:`, error.response?.data || error.message);
    }
  }

  console.log(`\nReprocessing complete! Total analytes saved: ${totalAnalytesSaved}`);
  process.exit(0);
}

reprocessLabDocuments();
