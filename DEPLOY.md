# 모바일 배포 가이드 (PWA)

이 앱은 **PWA(Progressive Web App)** 로 만들어져 있어, 앱스토어 없이 폰 브라우저에서
**"홈 화면에 추가"** 하면 앱처럼 전체화면으로 사용할 수 있습니다.

> ⚠️ **중요 — 데이터 공유 전제조건**
> 현재 버전은 데이터를 각 기기의 브라우저(localStorage)에만 저장합니다.
> 즉 **팀원 간 근태 공유는 아직 되지 않습니다**(각자 자기 입력만 보임).
> 실제 공유는 다음 단계인 **백엔드(Supabase 등) 연동** 후 동작합니다.
> 지금 배포는 "설치형 파일럿" 용도입니다.

---

## 방법 A. Vercel 배포 (외부 클라우드 · 추천)

1. https://vercel.com 에 **GitHub(hahence) 계정**으로 로그인
2. **Add New… → Project → Import** `hahence/vpd-worklog`
3. 설정은 자동 인식됩니다 (수정 불필요):
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. **Deploy** 클릭 → 약 1분 후 `https://vpd-worklog.vercel.app` 발급
5. 폰에서 그 주소 접속 →
   - **iPhone(Safari)**: 공유 버튼 → "홈 화면에 추가"
   - **Android(Chrome)**: 하단 "홈 화면에 추가" 배너 또는 ⋮ → "앱 설치"
6. 이후 `git push` 하면 Vercel이 **자동 재배포**합니다.

## 방법 B. Cloudflare Pages (무료 접근제어 필요 시)

Vercel과 동일하게 GitHub 저장소를 연결. Build `npm run build`, Output `dist`.
**Cloudflare Access**로 사내 이메일/SSO 인증 게이트를 무료로 걸 수 있어, 민감정보 보호에 유리.

---

## 🔒 접근 제어 (사번·실명 데이터라 필수 검토)

기본 배포 URL은 **공개**입니다. 근태·사번·실명은 민감정보이므로 아래 중 하나를 권장:

- **Cloudflare Pages + Access**: 사내 이메일 도메인/SSO로 접근 제한 (무료)
- **Vercel Password Protection / SSO**: Pro 플랜 기능
- **파일럿 한정**: URL을 팀 내부에만 비공개 공유하고 짧게 운영

## 참고

- PWA 설치는 **HTTPS**에서만 됩니다 (Vercel/Cloudflare 모두 자동 HTTPS).
- 커스텀 도메인(예: `worklog.사내도메인`) 연결 가능.
- 아이콘/이름 변경: `public/` 아이콘 재생성(`node scripts/gen-icons.mjs`) + `vite.config.ts`의 `manifest` 수정.

## 다음 단계 (실제 팀 공유)

Supabase 프로젝트 생성 → `users / attendance / absence / holiday` 테이블 설계 →
`src/store/AppStore.tsx`의 localStorage 로직을 Supabase 호출로 교체 → 실시간 팀 공유 완성.
