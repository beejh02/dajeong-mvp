# 다정 프로젝트 명세

## 1. 프로젝트 개요

다정은 키오스크 전용 서비스가 아니라, 사용자의 요청을 AI가 이해하고 여러 기업 서비스와 연결해주는 MCP 기반 AI 플랫폼 MVP이다.

## 2. 문제의식

디지털 취약 사용자는 기업마다 다른 UI/UX를 가진 키오스크를 사용할 때 어려움을 겪는다.

## 3. MVP 목표

이번 MVP에서는 A기업과 B기업의 서로 다른 키오스크 UI를 만들고, 다정 AI가 사용자의 주문 과정을 도와주는 흐름을 시연한다.

## 4. 핵심 데모 범위

- A기업 키오스크: Vertical UI
- B기업 키오스크: Horizontal UI
- 다정 AI 채팅
- 카드형 응답 UI
- 관리자 페이지
- Backend API
- MCP Server

## 5. 하지 않는 것

- 실제 결제 연동은 MVP 범위에서 제외
- 실제 Korail 예매는 제외
- 키오스크 전용 서비스로 정의하지 않음
- 모든 기업 연동을 실제 API로 구현하지 않음

## 6. 현재 결정사항

- Frontend: Next.js
- AI SDK: Vercel AI SDK
- AI Model: Gemini Flash
- Kiosk Demo: A기업 / B기업 2개
- A기업: Vertical UI
- B기업: Horizontal UI
- AI 응답: 카드 UI 포함
- 주문 계약: `companyId`는 실제 주문 대상 기업, `sourceChannel`은 주문 유입 채널로 분리
- Dajeong AI 주문은 `sourceChannel`을 `dajeong_ai`로 보내고, `companyId`는 A기업/B기업 실제 id를 유지
