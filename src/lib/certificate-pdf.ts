import { jsPDF } from "jspdf";
import QRCode from "qrcode";

/**
 * Generates a print-quality PDF certificate (A4 landscape).
 * Runs fully client-side — no server round-trip, no external service.
 */
export async function generateCertificatePdf(opts: {
  clubName: string;
  eventTitle: string;
  participantName: string;
  achievement: string;
  dateLabel: string;
  certificateId: string;
  verifyUrl: string;
}): Promise<void> {
  const { clubName, eventTitle, participantName, achievement, dateLabel, certificateId, verifyUrl } = opts;

  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const W = pdf.internal.pageSize.getWidth();
  const H = pdf.internal.pageSize.getHeight();

  // Background
  pdf.setFillColor(12, 17, 15);
  pdf.rect(0, 0, W, H, "F");

  // Accent border
  pdf.setDrawColor(163, 230, 53);
  pdf.setLineWidth(1.2);
  pdf.rect(10, 10, W - 20, H - 20);
  pdf.setLineWidth(0.3);
  pdf.rect(13, 13, W - 26, H - 26);

  // Corner accents
  pdf.setFillColor(163, 230, 53);
  pdf.rect(10, 10, 26, 1.2, "F");
  pdf.rect(10, 10, 1.2, 26, "F");
  pdf.rect(W - 36, H - 11.2, 26, 1.2, "F");
  pdf.rect(W - 11.2, H - 36, 1.2, 26, "F");

  const cx = W / 2;
  // Club name
  pdf.setTextColor(163, 230, 53);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(13);
  pdf.text(clubName.toUpperCase(), cx, 30, { align: "center", charSpace: 1.2 });

  // Title
  pdf.setTextColor(245, 250, 245);
  pdf.setFontSize(34);
  pdf.text("Certificate of Achievement", cx, 55, { align: "center" });

  // Presented to
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(11);
  pdf.setTextColor(160, 175, 168);
  pdf.text("This certificate is proudly presented to", cx, 72, { align: "center" });

  // Participant name
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(30);
  pdf.setTextColor(163, 230, 53);
  pdf.text(participantName, cx, 88, { align: "center" });

  // Achievement
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(13);
  pdf.setTextColor(220, 230, 224);
  pdf.text(`for ${achievement}`, cx, 102, { align: "center" });
  pdf.setFontSize(11);
  pdf.setTextColor(160, 175, 168);
  pdf.text(eventTitle, cx, 112, { align: "center" });

  // Date + club footer
  pdf.setFontSize(10);
  pdf.setTextColor(140, 155, 148);
  pdf.text(`Awarded on ${dateLabel}`, 30, H - 30);
  pdf.text(`Issued by ${clubName}`, 30, H - 24);

  // Certificate ID
  pdf.setFont("courier", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(163, 230, 53);
  pdf.text(certificateId, W - 30, H - 24, { align: "right" });
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(120, 135, 128);
  pdf.text(`Verify at ${verifyUrl}`, W - 30, H - 30, { align: "right" });

  // QR code
  const qrData = await QRCode.toDataURL(verifyUrl, { margin: 0, width: 220, color: { dark: "#0c110f", light: "#a3e635" } });
  pdf.addImage(qrData, "PNG", W - 38, 24, 20, 20);

  pdf.save(`certificate-${certificateId}.pdf`);
}
