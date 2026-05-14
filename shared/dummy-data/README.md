# Shared Dummy Data

이 폴더는 Dajeong MVP 시연용 fake seed 데이터입니다. 실제 사용자 개인정보, 실제 카드번호, 실제 결제수단, 실제 예약 정보는 포함하지 않습니다.

## Files

- `users.json`: demo 로그인 계정과 화면 표시용 프로필
- `brands.json`: A/B/C기업 demo 브랜드 정의
- `stores.json`: 브랜드별 demo 매장
- `menus.json`: A기업 실제 주문 demo 메뉴와 B/C기업 mock 메뉴
- `preferences.json`: 사용자 선호/비선호 재료
- `order_history.json`: "늘 먹던 햄버거" 시나리오용 최근 주문
- `payment_profiles.json`: mock 결제 profile token
- `point_memberships.json`: mock 포인트 membership

## Demo Credentials

```text
일반 사용자: user1 / user1234
관리자: admin / dajeong
```

비밀번호 값은 demo seed 변환용 원문입니다. Phase 2 backend에서는 이 값을 그대로 저장하지 않고 해시로 변환해야 합니다.
