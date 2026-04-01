import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { createClient as createServerClient } from '@/lib/supabase-server';

async function verifyAdmin(request?: NextRequest): Promise<boolean> {
  // 비밀번호 헤더로 인증
  if (request) {
    const pw = request.headers.get('X-Admin-Password');
    if (pw && pw === process.env.ADMIN_PASSWORD) return true;
  }
  // Supabase 인증
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from('user_plans')
    .select('plan')
    .eq('user_id', user.id)
    .maybeSingle();

  return data?.plan === 'admin';
}

export async function POST(request: NextRequest) {
  const isAdmin = await verifyAdmin(request);
  if (!isAdmin) {
    return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 });
  }

  try {
    const { email, name, plan, expiresAt, daysLeft } = await request.json();

    if (!email || !plan || expiresAt === undefined) {
      return NextResponse.json({ error: '필수 정보가 누락되었습니다.' }, { status: 400 });
    }

    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_APP_PASSWORD;
    if (!smtpUser || !smtpPass) {
      return NextResponse.json({ error: 'SMTP_USER 또는 SMTP_APP_PASSWORD가 설정되지 않았습니다.' }, { status: 500 });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    const planName = plan === 'pro' ? '프로(Pro)' : '맥스(Max)';
    const planPrice = plan === 'pro' ? '29,700원' : '79,200원';
    const userName = name || '고객';
    const expDate = new Date(expiresAt);
    const expDateStr = `${expDate.getFullYear()}년 ${expDate.getMonth() + 1}월 ${expDate.getDate()}일`;

    let urgencyMessage = '';
    if (daysLeft < 0) {
      urgencyMessage = `<p style="color:#dc2626;font-weight:bold;font-size:16px;">⚠ 구독이 이미 만료되었습니다 (${Math.abs(daysLeft)}일 초과)</p>`;
    } else if (daysLeft <= 3) {
      urgencyMessage = `<p style="color:#dc2626;font-weight:bold;font-size:16px;">⚠ 구독 만료까지 ${daysLeft}일 남았습니다</p>`;
    } else if (daysLeft <= 7) {
      urgencyMessage = `<p style="color:#2563eb;font-weight:bold;font-size:16px;">📌 구독 만료까지 ${daysLeft}일 남았습니다</p>`;
    } else {
      urgencyMessage = `<p style="color:#059669;font-size:16px;">구독 만료까지 <strong>${daysLeft}일</strong> 남았습니다</p>`;
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://aio-geo-optimizer.vercel.app';

    const htmlContent = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:24px;">

    <!-- 헤더 -->
    <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);border-radius:16px 16px 0 0;padding:32px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:22px;">GEOAIO</h1>
      <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">구독 만료 안내</p>
    </div>

    <!-- 본문 -->
    <div style="background:#fff;padding:32px;border:1px solid #e5e7eb;border-top:none;">

      <p style="font-size:16px;color:#1f2937;margin:0 0 20px;">안녕하세요, <strong>${userName}</strong>님</p>

      ${urgencyMessage}

      <!-- 구독 정보 카드 -->
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin:20px 0;">
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <tr>
            <td style="padding:8px 0;color:#64748b;">현재 구독</td>
            <td style="padding:8px 0;text-align:right;font-weight:bold;color:#1f2937;">${planName}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#64748b;">월 이용료</td>
            <td style="padding:8px 0;text-align:right;font-weight:bold;color:#1f2937;">${planPrice}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#64748b;">만료 예정일</td>
            <td style="padding:8px 0;text-align:right;font-weight:bold;color:#dc2626;">${expDateStr}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#64748b;">남은 일수</td>
            <td style="padding:8px 0;text-align:right;font-weight:bold;color:${daysLeft <= 3 ? '#dc2626' : daysLeft <= 7 ? '#2563eb' : '#059669'};">${daysLeft < 0 ? `만료 ${Math.abs(daysLeft)}일 초과` : `D-${daysLeft}`}</td>
          </tr>
        </table>
      </div>

      <!-- 만료 안내 -->
      <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:16px;margin:20px 0;">
        <p style="color:#991b1b;font-weight:bold;margin:0 0 8px;font-size:14px;">⚠ 만료 시 변경 사항</p>
        <ul style="color:#7f1d1d;font-size:13px;margin:0;padding-left:20px;line-height:1.8;">
          <li>구독 만료일까지 결제가 확인되지 않으면 <strong>무료 계정으로 자동 전환</strong>됩니다</li>
          <li>무료 계정은 기능당 <strong>월 3회</strong>로 사용이 제한됩니다</li>
          <li>기존에 생성/저장한 콘텐츠는 유지됩니다</li>
        </ul>
      </div>

      <!-- 결제 안내 -->
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px;margin:20px 0;">
        <p style="color:#166534;font-weight:bold;margin:0 0 8px;font-size:14px;">💳 구독 유지 방법</p>
        <ol style="color:#15803d;font-size:13px;margin:0;padding-left:20px;line-height:2;">
          <li>아래 계좌로 <strong>${planPrice}</strong>을 송금해주세요</li>
          <li>송금 후 관리자에게 연락 주시면 바로 갱신 처리해드립니다</li>
        </ol>
        <div style="background:#dcfce7;border-radius:8px;padding:12px;margin-top:12px;">
          <p style="margin:0;font-size:13px;color:#166534;">
            <strong>입금 계좌:</strong> 농협 352-0699-6074-53 (예금주: 심재우)<br/>
            <strong>입금액:</strong> ${planPrice}<br/>
            <strong>입금자명:</strong> 가입 시 사용한 이름
          </p>
        </div>
      </div>

      <!-- CTA 버튼 -->
      <div style="text-align:center;margin:28px 0;">
        <a href="${siteUrl}/pricing" style="display:inline-block;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:14px;font-weight:bold;">
          요금제 확인하기
        </a>
      </div>

      <p style="font-size:13px;color:#6b7280;line-height:1.6;">
        문의사항이 있으시면 언제든 회신해주세요.<br/>
        감사합니다.
      </p>
    </div>

    <!-- 푸터 -->
    <div style="text-align:center;padding:20px;font-size:11px;color:#9ca3af;">
      <p style="margin:0;">GEOAIO | AI 최적화 콘텐츠 플랫폼</p>
      <p style="margin:4px 0 0;">${siteUrl}</p>
    </div>
  </div>
</body>
</html>`;

    await transporter.sendMail({
      from: `GEOAIO <${smtpUser}>`,
      to: email,
      subject: `[AIO] ${planName} 구독 만료 안내 (${daysLeft < 0 ? '만료됨' : `D-${daysLeft}`})`,
      html: htmlContent,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : '서버 오류' },
      { status: 500 }
    );
  }
}
