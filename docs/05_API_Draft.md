# API 초안

이 문서는 구현 전 endpoint 후보를 정리한 초안입니다. 실제 구현 시 `shared/docs/API_SPEC.md` 또는 OpenAPI 문서로 승격합니다.

## Auth

| Method | Endpoint | 설명 |
| --- | --- | --- |
| POST | `/auth/register` | 회원가입 |
| POST | `/auth/login` | 로그인 |
| GET | `/auth/me` | 현재 사용자 조회 |
| POST | `/auth/agent-handoff` | agent handoff token 생성 후보 |
| POST | `/auth/agent-session` | agent handoff token 교환 후보 |

## Menu

| Method | Endpoint | 설명 |
| --- | --- | --- |
| GET | `/menu` | A기업 메뉴 목록 |
| GET | `/menu/{menu_item_id}` | 메뉴 상세와 옵션 |

## Order and Payment

| Method | Endpoint | 설명 |
| --- | --- | --- |
| POST | `/orders` | 주문 생성 |
| POST | `/payments/dummy/approve` | Mock 결제 승인 |
| GET | `/points/me` | 내 포인트 조회 |
| GET | `/orders/{order_id}/receipt` | 주문 완료/영수증 조회 |

## Dajeong Chat

| Method | Endpoint | 설명 |
| --- | --- | --- |
| POST | `/dajeong/chat` | 자연어 입력 처리와 주문 후보 생성 |
| POST | `/dajeong/final-approval` | 주문 후보 최종 승인 |

## Admin

| Method | Endpoint | 설명 |
| --- | --- | --- |
| GET | `/admin/orders` | 주문 목록 |
| GET | `/admin/orders/{order_id}` | 주문 상세 |
| PATCH | `/admin/orders/{order_id}/status` | 주문 상태 변경 |
| GET | `/admin/mcp-logs` | MCP 호출 로그 목록 |
| GET | `/admin/mcp-logs/{log_id}` | MCP 호출 로그 상세 |

## MCP Adapter

초기 MVP에서는 HTTP 또는 local adapter로 시작할 수 있습니다. 중요한 것은 backend와 tool 구현의 경계입니다.

| Tool | 설명 |
| --- | --- |
| `get_menus` | 메뉴 목록 조회 |
| `get_menu_detail` | 메뉴 상세 조회 |
| `get_recent_orders` | 최근 주문 조회 |
| `create_order_draft` | 주문 후보 생성 |
| `place_order` | 주문 생성 |
| `request_payment` | Mock 또는 테스트 결제 요청 |
