import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer, Document } from '@react-pdf/renderer';
import { WorkoutSummaryPDF } from '@/components/pdf/WorkoutSummaryPDF';
import { createElement, type ReactElement } from 'react';
import type { DocumentProps } from '@react-pdf/renderer';

export async function POST(req: NextRequest) {
  try {
    const { session, score, userName } = await req.json() as {
      session: Parameters<typeof WorkoutSummaryPDF>[0]['session'];
      score?: Parameters<typeof WorkoutSummaryPDF>[0]['score'];
      userName?: string;
    };

    const element = createElement(
      WorkoutSummaryPDF,
      { session, score, userName }
    ) as ReactElement<DocumentProps>;

    const pdfBuffer = await renderToBuffer(element);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="workout-${session.id.slice(0, 8)}.pdf"`,
      },
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 });
  }
}
