import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// pdf-parse 1.x — pdfjs-dist worker 의존 없이 자체 파싱.
// ⚠️ index.js 의 디버그 코드가 ESM 환경에서 테스트 파일을 찾으려 하는 버그가 있어
// 하위 모듈(`pdf-parse/lib/pdf-parse.js`)을 직접 import 해 진입점을 우회한다.
async function extractPdfText(buffer: Buffer): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfParse = ((await import('pdf-parse/lib/pdf-parse.js')) as any).default;
  const data = await pdfParse(buffer);
  return data.text || '';
}

async function extractPptxText(buffer: Buffer): Promise<string> {
  const JSZip = (await import('jszip')).default;
  const zip = await JSZip.loadAsync(buffer);
  const slideFiles = Object.keys(zip.files)
    .filter(name => name.match(/^ppt\/slides\/slide\d+\.xml$/))
    .sort((a, b) => {
      const numA = parseInt(a.match(/slide(\d+)/)?.[1] || '0');
      const numB = parseInt(b.match(/slide(\d+)/)?.[1] || '0');
      return numA - numB;
    });
  const parts: string[] = [];
  for (const slidePath of slideFiles) {
    const xml = await zip.files[slidePath].async('text');
    // <a:t> 태그에서 텍스트 추출
    const matches = xml.match(/<a:t>([^<]*)<\/a:t>/g);
    if (matches) {
      const slideText = matches
        .map(m => m.replace(/<\/?a:t>/g, ''))
        .join(' ');
      if (slideText.trim()) parts.push(slideText.trim());
    }
  }
  // 슬라이드 노트도 추출
  const noteFiles = Object.keys(zip.files)
    .filter(name => name.match(/^ppt\/notesSlides\/notesSlide\d+\.xml$/));
  for (const notePath of noteFiles) {
    const xml = await zip.files[notePath].async('text');
    const matches = xml.match(/<a:t>([^<]*)<\/a:t>/g);
    if (matches) {
      const noteText = matches
        .map(m => m.replace(/<\/?a:t>/g, ''))
        .join(' ');
      if (noteText.trim()) parts.push(`[노트] ${noteText.trim()}`);
    }
  }
  return parts.join('\n\n');
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ error: '파일이 없습니다.' }, { status: 400 });
    }

    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json(
        { error: `파일 크기가 20MB를 초과합니다 (${(file.size / 1024 / 1024).toFixed(1)}MB)` },
        { status: 400 }
      );
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const buffer = Buffer.from(await file.arrayBuffer());
    let text = '';

    switch (ext) {
      case 'pdf': {
        text = await extractPdfText(buffer);
        break;
      }

      case 'docx': {
        const mammoth = await import('mammoth');
        const result = await mammoth.extractRawText({ buffer });
        text = result.value;
        break;
      }

      case 'pptx': {
        text = await extractPptxText(buffer);
        break;
      }

      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp':
      case 'bmp': {
        const base64 = buffer.toString('base64');
        const mimeType = file.type || `image/${ext === 'jpg' ? 'jpeg' : ext}`;
        text = `[이미지 파일: ${file.name}]\ndata:${mimeType};base64,${base64}`;
        break;
      }

      case 'txt':
      case 'md':
      case 'csv':
      case 'json':
      case 'html':
      case 'xml':
      case 'log': {
        text = buffer.toString('utf-8');
        break;
      }

      default:
        return NextResponse.json(
          { error: `지원하지 않는 파일 형식입니다: .${ext}` },
          { status: 400 }
        );
    }

    if (!text || !text.trim()) {
      return NextResponse.json(
        { error: '파일에서 텍스트를 추출할 수 없습니다.' },
        { status: 400 }
      );
    }

    const maxLength = 30000;
    if (text.length > maxLength) {
      text = text.substring(0, maxLength) + '\n\n... (텍스트가 잘렸습니다)';
    }

    return NextResponse.json({ text, fileName: file.name });
  } catch (error) {
    console.error('File parse error:', error);
    const message = error instanceof Error ? error.message : '파일을 처리하는 중 오류가 발생했습니다.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// v1777031107 - Cache bust
