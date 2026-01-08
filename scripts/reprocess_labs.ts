import { db } from '../server/db';
import { medicalDocuments, labAnalytes } from '../shared/schema';
import { eq, and, isNull } from 'drizzle-orm';
import axios from 'axios';
import FormData from 'form-data';

async function reprocessLabDocuments() {
  console.log('Starting lab document reprocessing...');
  
  const docs = await db
    .select({
      id: medicalDocuments.id,
      userId: medicalDocuments.userId,
      originalName: medicalDocuments.originalName,
      mimeType: medicalDocuments.mimeType,
      fileData: medicalDocuments.fileData,
    })
    .from(medicalDocuments)
    .where(
      and(
        eq(medicalDocuments.fileType, 'lab'),
        isNull(medicalDocuments.deletedAt)
      )
    );

  console.log(`Found ${docs.length} lab documents to process`);

  for (const doc of docs) {
    if (!doc.fileData) {
      console.log(`Skipping ${doc.originalName}: No file data`);
      continue;
    }

    try {
      console.log(`Processing: ${doc.originalName}`);
      
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
      console.log(`OCR result for ${doc.originalName}:`, ocrResult.parsed?.analitos?.length || 0, 'analytes found');

      if (ocrResult.parsed?.analitos?.length > 0) {
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
        }
        console.log(`Saved ${ocrResult.parsed.analitos.length} analytes for ${doc.originalName}`);
      }
    } catch (error: any) {
      console.error(`Error processing ${doc.originalName}:`, error.message);
    }
  }

  console.log('Reprocessing complete!');
  process.exit(0);
}

reprocessLabDocuments();
