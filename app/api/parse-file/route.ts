import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Web API polyfills for Node.js — pdf-parse@2 / pdfjs-dist 가 브라우저 전용 객체를 호출함.
// 텍스트 추출 경로에서는 그래픽 메서드가 실제로 사용되지 않으므로 빈 stub 으로 충분.
function installPdfPolyfills() {
  const g = globalThis as Record<string, unknown>;
  if (typeof g.DOMMatrix === 'undefined') {
    class DOMMatrixPolyfill {
      a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
      m11 = 1; m12 = 0; m13 = 0; m14 = 0;
      m21 = 0; m22 = 1; m23 = 0; m24 = 0;
      m31 = 0; m32 = 0; m33 = 1; m34 = 0;
      m41 = 0; m42 = 0; m43 = 0; m44 = 1;
      is2D = true;
      isIdentity = true;
      constructor(_init?: unknown) {}
      multiply() { return this; }
      multiplySelf() { return this; }
      preMultiplySelf() { return this; }
      inverse() { return this; }
      invertSelf() { return this; }
      translate() { return this; }
      translateSelf() { return this; }
      scale() { return this; }
      scaleSelf() { return this; }
      scale3d() { return this; }
      scale3dSelf() { return this; }
      rotate() { return this; }
      rotateSelf() { return this; }
      rotateAxisAngle() { return this; }
      rotateAxisAngleSelf() { return this; }
      rotateFromVector() { return this; }
      rotateFromVectorSelf() { return this; }
      skewX() { return this; }
      skewXSelf() { return this; }
      skewY() { return this; }
      skewYSelf() { return this; }
      flipX() { return this; }
      flipY() { return this; }
      transformPoint() { return { x: 0, y: 0, z: 0, w: 1 }; }
      toFloat32Array() { return new Float32Array(16); }
      toFloat64Array() { return new Float64Array(16); }
      toString() { return 'matrix(1, 0, 0, 1, 0, 0)'; }
      static fromMatrix() { return new DOMMatrixPolyfill(); }
      static fromFloat32Array() { return new DOMMatrixPolyfill(); }
      static fromFloat64Array() { return new DOMMatrixPolyfill(); }
    }
    g.DOMMatrix = DOMMatrixPolyfill;
  }
  if (typeof g.Path2D === 'undefined') {
    class Path2DPolyfill {
      addPath() {}
      closePath() {}
      moveTo() {}
      lineTo() {}
      bezierCurveTo() {}
      quadraticCurveTo() {}
      arc() {}
      arcTo() {}
      ellipse() {}
      rect() {}
      roundRect() {}
    }
    g.Path2D = Path2DPolyfill;
  }
  if (typeof g.ImageData === 'undefined') {
    class ImageDataPolyfill {
      width: number;
      height: number;
      data: Uint8ClampedArray;
      colorSpace = 'srgb';
      constructor(...args: unknown[]) {
        if (args[0] instanceof Uint8ClampedArray) {
          this.data = args[0];
          this.width = args[1] as number;
          this.height = (args[2] as number) || (args[0].length / 4 / (args[1] as number));
        } else {
          this.width = args[0] as number;
          this.height = args[1] as number;
          this.data = new Uint8ClampedArray(this.width * this.height * 4);
        }
      }
    }
    g.ImageData = ImageDataPolyfill;
  }
}

async function extractPdfText(buffer: Buffer): Promise<string> {
  installPdfPolyfills();
  const { PDFParse } = await import('pdf-parse');
  const uint8Array = new Uint8Array(buffer);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parser = new PDFParse(uint8Array) as any;
  await parser.load();
  const result = await parser.getText();
  return result.text || '';
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
