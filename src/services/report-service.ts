import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { theme } from '../styles/theme';
import { format } from 'date-fns';
import { supabase } from '../lib/supabase';
import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system';
import { summarizeVetReport } from './gemini-vision';

interface ReportData {
  petName: string;
  careScore: number;
  medications: any[];
  vitals: any[];
  activityLogs: any[];
  externalReports?: any[];
}

export const generateClinicalReport = async (data: ReportData) => {
  const htmlContent = `
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
          
          body {
            font-family: 'Inter', sans-serif;
            padding: 40px;
            color: #1a1a1a;
            line-height: 1.6;
          }
          
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid ${theme.colors.primary};
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          
          .logo-text {
            font-size: 24px;
            font-weight: 800;
            color: ${theme.colors.primary};
          }
          
          .report-title {
            font-size: 14px;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          
          .pet-info {
            margin-bottom: 40px;
          }
          
          .pet-name {
            font-size: 32px;
            font-weight: 700;
            margin: 0;
          }
          
          .care-score-box {
            background: ${theme.colors.primary}10;
            padding: 20px;
            border-radius: 12px;
            display: inline-block;
            margin-top: 10px;
          }
          
          .score-value {
            font-size: 24px;
            font-weight: 700;
            color: ${theme.colors.primary};
          }
          
          .section-title {
            font-size: 18px;
            font-weight: 700;
            margin-top: 40px;
            margin-bottom: 15px;
            border-left: 4px solid ${theme.colors.primary};
            padding-left: 12px;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          
          th {
            text-align: left;
            background: #f8f9fa;
            padding: 12px;
            font-size: 12px;
            text-transform: uppercase;
            color: #666;
          }
          
          td {
            padding: 12px;
            border-bottom: 1px solid #eee;
            font-size: 14px;
          }
          
          .status-badge {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 600;
          }
          
          .status-active { background: #e7f5ff; color: #228be6; }
          
          .footer {
            margin-top: 60px;
            text-align: center;
            font-size: 12px;
            color: #999;
            border-top: 1px solid #eee;
            padding-top: 20px;
          }
          
          .chart-placeholder {
            height: 150px;
            background: #f8f9fa;
            border: 1px dashed #ccc;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #999;
            font-style: italic;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo-text">HALO PET CARE</div>
          <div class="report-title">Clinical Health Report</div>
        </div>
        
        <div class="pet-info">
          <h1 class="pet-name">${data.petName}</h1>
          <div class="care-score-box">
            Clinical Care Score: <span class="score-value">${data.careScore}%</span>
          </div>
          <p style="color: #666; font-size: 14px;">Report Generated: ${format(new Date(), 'PPpp')}</p>
        </div>
        
        <div class="section-title">Medication Adherence</div>
        <table>
          <thead>
            <tr>
              <th>Medication</th>
              <th>Dosage</th>
              <th>Frequency</th>
              <th>Inventory</th>
            </tr>
          </thead>
          <tbody>
            ${data.medications.map(med => `
              <tr>
                <td><strong>${med.name}</strong></td>
                <td>${med.dosage_instructions}</td>
                <td>Every ${med.interval_hours}h</td>
                <td>${med.remaining_doses || 'N/A'} doses left</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="section-title">Vital Signs (Weight History)</div>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Weight</th>
              <th>Change</th>
            </tr>
          </thead>
          <tbody>
            ${data.vitals.slice(0, 5).map((v, i, arr) => {
              const diff = i < arr.length - 1 ? (v.value - arr[i+1].value).toFixed(1) : '—';
              const diffColor = parseFloat(diff) > 0 ? 'red' : parseFloat(diff) < 0 ? 'green' : '#666';
              return `
                <tr>
                  <td>${format(new Date(v.recorded_at), 'MMM d, yyyy')}</td>
                  <td>${v.value} kg</td>
                  <td style="color: ${diffColor}">${diff > 0 ? '+' : ''}${diff}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
        
        ${data.externalReports && data.externalReports.length > 0 ? `
          <div class="section-title">External Veterinary Records (AI Summaries)</div>
          ${data.externalReports.map(report => `
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 15px; border: 1px solid #eee;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px; border-bottom: 1px solid #ddd; padding-bottom: 5px;">
                <span style="font-weight: 700; color: ${theme.colors.primary};">${report.title}</span>
                <span style="font-size: 12px; color: #666;">${format(new Date(report.created_at), 'MMM d, yyyy')}</span>
              </div>
              <div style="font-size: 13px; line-height: 1.5; color: #333;">
                ${report.ai_summary || 'Detailed summary pending processing.'}
              </div>
            </div>
          `).join('')}
        ` : ''}

        <div class="section-title">Recent Activity History</div>
        <table>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Medication</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${data.activityLogs.slice(0, 15).map(log => {
              const isRefused = log.status === 'refused';
              return `
                <tr>
                  <td>${format(new Date(log.taken_at), 'MMM d, h:mm a')}</td>
                  <td>${log.medications?.name || 'Unknown'}</td>
                  <td>
                    <span class="status-badge" style="background: ${isRefused ? '#fff5f5' : '#e7f5ff'}; color: ${isRefused ? '#fa5252' : '#228be6'}; border: 1px solid ${isRefused ? '#ffc9c9' : '#a5d8ff'};">
                      ${isRefused ? 'Refused / Spit Out' : 'Administered'}
                    </span>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>

        ${data.activityLogs.filter(l => l.status === 'refused').length > 0 ? `
          <div class="section-title" style="color: #fa5252; border-left-color: #fa5252;">Difficulty Analysis (Refusals)</div>
          <div style="background: #fff5f5; padding: 15px; border-radius: 8px; border: 1px solid #ffc9c9;">
            <p style="margin: 0; font-size: 14px; color: #c92a2a;">
              <strong>Note to Veterinarian:</strong> The patient has refused or spit out medication 
              <strong>${data.activityLogs.filter(l => l.status === 'refused').length} times</strong> during this tracking period. 
              This may indicate palatability issues or difficulty in administration that requires professional adjustment of the treatment delivery method.
            </p>
          </div>
        ` : ''}

        <div class="footer">
          This report was generated by Halo Pet Care. For clinical questions, please consult your veterinarian.
          <br/>HALO-ID: ${Math.random().toString(36).substr(2, 9).toUpperCase()}
        </div>
      </body>
    </html>
  `;

  try {
    const { uri } = await Print.printToFileAsync({ html: htmlContent });
    await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
  } catch (error) {
    console.error('Failed to generate PDF:', error);
    throw error;
  }
};

export const uploadVetReport = async (petId: string, file: any, title: string) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const fileExt = file.name.split('.').pop();
    const fileName = `${petId}/${Date.now()}.${fileExt}`;
    const filePath = `reports/${fileName}`;

    // Read file as base64
    const base64 = await FileSystem.readAsStringAsync(file.uri, { encoding: FileSystem.EncodingType.Base64 });
    const arrayBuffer = decode(base64);

    // Get AI Summary
    const aiSummary = await summarizeVetReport(base64);

    const { error: storageError } = await supabase.storage
      .from('vet-reports')
      .upload(filePath, arrayBuffer, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (storageError) throw storageError;

    const { data: { publicUrl } } = supabase.storage
      .from('vet-reports')
      .getPublicUrl(filePath);

    const { error: dbError } = await supabase
      .from('vet_reports')
      .insert({
        pet_id: petId,
        owner_id: user.id,
        title: title,
        file_url: publicUrl,
        ai_summary: aiSummary,
        notes: `Uploaded via Halo App on ${format(new Date(), 'yyyy-MM-dd')}`
      });

    if (dbError) throw dbError;

    return publicUrl;
  } catch (error) {
    console.error('Upload Error:', error);
    throw error;
  }
};

export const fetchVetReports = async (petId: string) => {
  const { data, error } = await supabase
    .from('vet_reports')
    .select('*')
    .eq('pet_id', petId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};
