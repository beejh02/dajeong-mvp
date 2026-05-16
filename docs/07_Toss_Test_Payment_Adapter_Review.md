# Toss 테스트 결제 Adapter 검토

검토 일자: 2026-05-16

## 결론

Phase 7에서는 기존 `POST /payments/dummy/approve` 흐름을 바로 교체하지 않고, 테스트 결제 adapter를 별도 provider로 추가할 수 있는 구조를 먼저 잡는 것이 적절합니다. 현재 MVP는 Mock 결제로도 주문, 포인트, 영수증, 관리자 확인 흐름을 안정적으로 보여주고 있으므로 Toss 테스트 결제는 발표 보강용 선택 기능입니다.

권장 방향은 `DummyPaymentProvider`를 기본값으로 유지하고, 이후 `TossTestPaymentProvider`를 설정값으로 켜는 방식입니다. Toss 결제창/Widget은 사용자 인증 단계에만 사용하고, 결제 승인과 금액 검증은 반드시 backend에서 처리합니다.

## 공식 문서 기준

- Toss Payments는 테스트 secret key(`test_sk` 또는 `test_gsk`)를 사용하면 test mode로 동작하며 live 데이터와 결제수단에 영향을 주지 않는다고 안내합니다.
- Payment Widget은 낮은 구현 비용으로 결제 UI와 약관 UI를 임베드하는 방식이며, 명시 요구가 없으면 V2 SDK와 Payment Widget을 우선 검토하는 것이 적절합니다.
- 클라이언트는 결제 인증을 시작할 수 있지만, 최종 결제 상태는 secret key를 가진 server가 `POST /v1/payments/confirm`으로 확정해야 합니다.
- `successUrl` redirect 이후 전달되는 `paymentKey`, `orderId`, `amount`는 backend에 전달하되, backend는 저장된 주문 금액과 `amount`가 같은지 확인한 뒤 confirm API를 호출해야 합니다.
- Toss Payments API 인증은 secret key 뒤에 colon을 붙여 base64 인코딩한 Basic auth header를 사용합니다.
- POST API 재시도 안정성을 위해 idempotency key header를 사용할 수 있고, 같은 key 요청은 동일 응답을 돌려주는 방식입니다.

참고 공식 문서:

- https://docs.tosspayments.com/en/integration-widget
- https://docs.tosspayments.com/en/api-guide
- https://docs.tosspayments.com/guides/v2/get-started/llms-quick-reference

## 현재 MVP와의 연결

현재 backend 결제 흐름:

```text
POST /orders
-> order_status=pending_payment, payment_status=ready
-> POST /payments/dummy/approve
-> order_status=accepted, payment_status=paid
-> point_ledger, receipt 생성
```

Toss 테스트 결제 adapter를 추가하더라도 이 상태 전이는 유지해야 합니다. 차이는 `dummy/approve`가 즉시 승인하던 부분을 Toss 인증 redirect와 backend confirm 단계로 나누는 것입니다.

권장 목표 흐름:

```text
POST /orders
-> backend가 서버 기준 금액과 provider_order_id를 고정
-> frontend가 Toss Widget 또는 결제창으로 인증 요청
-> Toss successUrl이 paymentKey, orderId, amount를 반환
-> backend가 주문 금액과 amount를 비교
-> backend가 Toss confirm API 호출
-> 성공 시 기존 payment/order/point/receipt 후처리 재사용
```

## Adapter 경계 제안

Backend service 계층에 provider 경계를 둡니다.

```text
PaymentProvider
  - DummyPaymentProvider
  - TossTestPaymentProvider
```

필요한 책임:

- 주문 금액은 항상 backend 주문 데이터에서 읽습니다.
- secret key는 backend 환경변수에만 둡니다.
- frontend에는 client key와 redirect URL 처리만 노출합니다.
- Toss `paymentKey`는 환불/조회에 필요하므로 결제 record에 저장할 후보입니다.
- idempotency key는 기존 payment idempotency 흐름과 충돌하지 않게 provider confirm 요청 단위로 분리합니다.

## 후보 API

Phase 7 구현 시 아래 endpoint를 후보로 둡니다. 이번 검토 단계에서는 구현하지 않습니다.

| Method | Endpoint | 설명 |
| --- | --- | --- |
| POST | `/payments/toss/test/ready` | 주문 ID 기준으로 Toss 테스트 결제 요청 정보 생성 |
| POST | `/payments/toss/test/confirm` | `paymentKey`, `orderId`, `amount`를 검증하고 Toss confirm 호출 |
| GET | `/payments/toss/test/fail` | 실패 redirect 디버깅 또는 frontend fail route 연결 후보 |

## 환경변수 후보

```text
PAYMENT_PROVIDER=dummy
TOSS_CLIENT_KEY=test_ck_...
TOSS_SECRET_KEY=test_sk_...
TOSS_SUCCESS_URL=http://127.0.0.1:5173/payment/toss/success
TOSS_FAIL_URL=http://127.0.0.1:5173/payment/toss/fail
```

주의:

- `TOSS_SECRET_KEY`는 repository, frontend bundle, API 응답에 포함하지 않습니다.
- 운영 key(`live_*`)는 MVP demo 환경에서 사용하지 않습니다.
- 실제 카드번호나 민감 결제정보는 저장하지 않습니다.

## 구현 전 체크리스트

- Toss 개발자센터에서 테스트 key와 test log 확인 권한을 준비합니다.
- backend test에서 금액 변조를 실패 처리하는 케이스를 먼저 추가합니다.
- dummy provider와 Toss test provider가 같은 후처리 함수를 쓰도록 결제 완료 처리를 분리합니다.
- frontend는 기존 Mock 결제 버튼을 유지하고, Toss 테스트 결제는 별도 선택 UI로 둡니다.
- 실패 redirect, 사용자가 결제창을 닫은 경우, confirm 중복 요청을 각각 검증합니다.

## 이번 검토에서 보류한 것

- 실제 Toss 실결제
- 운영 key 설정
- 환불 API 구현
- 가상계좌, 정기결제, key-in 결제
- Webhook 기반 비동기 결제
- 실제 카드번호 또는 민감 결제정보 저장
