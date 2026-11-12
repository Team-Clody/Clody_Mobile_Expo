# FCM 푸시 알림

Android와 iOS 모두 React Native Firebase Messaging에서 발급한 FCM 토큰을 서버로 전송한다. Android는 `expo-notifications`로 알림 채널을 만들고 앱 실행 중 받은 원격 알림을 로컬 알림으로 표시한다. iOS는 `firebase.json`의 foreground presentation 설정으로 원격 알림 자체를 표시한다. 두 방식을 플랫폼별로 분리해 같은 메시지가 중복 표시되거나 iOS 알림 delegate끼리 충돌하지 않도록 한다. Expo Push Token이나 iOS APNs 토큰을 서버의 `fcmToken`으로 전달하지 않는다.

## Firebase 및 서명 준비

서버에서 발송에 사용하는 Firebase 프로젝트에 다음 앱을 등록한다.

| 플랫폼 | 앱 식별자 | 설정 파일 기본 위치 | 대체 경로 환경변수 |
| --- | --- | --- | --- |
| Android | `com.clody.Clody_Mobile_Expo` | 프로젝트 루트의 `google-services.json` | `GOOGLE_SERVICES_JSON` |
| iOS | `com.clody.corp` | 프로젝트 루트의 `GoogleService-Info.plist` | `GOOGLE_SERVICES_PLIST` |

두 환경변수는 파일 내용이 아닌 **파일 경로**를 받는다. 로컬에서는 기존 iOS 앱의 Firebase 설정 파일을 확인했으며, 현재 앱과 동일한 Bundle ID와 Firebase 프로젝트인지 확인한 파일을 사용한다. 설정 파일은 Git에 포함하지 않으므로 다른 개발 환경에는 별도로 준비해야 한다. EAS에서는 파일 유형 환경변수로 두 파일을 등록한다. iOS 파일이 없는 환경에서는 Firebase Console에서 해당 Bundle ID의 파일을 내려받아야 한다.

iOS는 Apple Developer에서 앱 식별자의 Push Notifications 기능을 활성화하고, Firebase Console → 프로젝트 설정 → Cloud Messaging → iOS 앱 구성에 APNs 인증 키와 Key ID, Team ID를 등록한다. 푸시 권한을 포함한 프로비저닝 프로파일로 서명해야 한다. 앱 설정의 `aps-environment`는 개발용 기본값이며 배포 빌드에서는 서명 방식에 맞는 entitlement인지 확인한다.

## 개발 빌드

FCM 네이티브 모듈은 Expo Go에서 동작하지 않는다. 새 개발 빌드를 설치해야 한다.

```bash
npm install
npx expo prebuild --clean
npx expo run:android
# iOS 실기기에서 확인할 때
npx expo run:ios --device
```

`prebuild --clean`은 기존 `ios/`, `android/` 폴더를 재생성한다. 직접 수정한 네이티브 코드가 있다면 먼저 보관한다. 이 저장소에서는 두 폴더가 Git 추적 대상에서 제외되어 있으며, 설정의 기준은 `app.config.js`이다. EAS를 이용하는 경우 설정 파일을 준비하고 `development` 프로파일로 새 빌드를 만든다.

React Native Firebase는 앱의 Expo SDK 및 광고 모듈과 함께 사용하도록 23 계열을 고정한다. iOS는 `expo-build-properties`의 `useFrameworks: "static"` 설정을 사용한다.

Expo SDK 54에서 React 헤더를 사용하는 RNFB 모듈이 framework로 컴파일되지 않도록 `forceStaticLinking`에 `RNFBApp`, `RNFBMessaging`을 지정한다. Firebase SDK의 static frameworks 설정은 유지하며, 새 prebuild에도 같은 연결 방식이 적용된다.

Android에서는 Expo와 Firebase가 함께 선언하는 기본 알림 채널·색상 때문에 Manifest 병합 충돌이 발생할 수 있다. `withFirebaseNotificationOverrides` 플러그인이 앱의 채널·색상을 우선하도록 `tools:replace`를 설정하며, `prebuild`로 네이티브 폴더를 다시 만들어도 적용된다.

## 서버 연동

- 로그인·회원가입 요청의 `fcmToken`에 현재 FCM 토큰을 포함한다.
- 알림 권한 거부 또는 미지원 환경에서는 빈 문자열을 보내며 로그인 자체는 계속 진행한다. FCM 등록이 지연되면 최대 10초 후 인증을 계속하고, 앱 복귀 시 등록을 다시 확인한다.
- 로그인한 세션에서 토큰이 새로 발급되면 `POST /api/v1/alarm`에 `{ "fcmToken": "새 토큰" }`을 보낸다. 기존 알림 동의 여부와 시간을 함께 덮어쓰지 않는다.
- 온보딩에서 선택한 `HH:mm`과 일기 알림 동의는 가입 성공 후 별도로 저장한다. 건너뛰기는 일기 알림만 끄며, 설정 저장 실패 시 회원가입을 반복하지 않고 설정만 다시 저장한다.
- 로그아웃·탈퇴 시 기기의 FCM 토큰 삭제를 백그라운드에서 시작해 화면 전환이 네트워크를 기다리지 않도록 한다. 삭제 완료 전에는 새 세션의 토큰 등록을 대기시킨다. 별도의 서버 토큰 해제 API는 현재 스웨거에 없다.

알림 갱신 요청은 `{ "data": { ... } }`로 감싸지 않는 평문 JSON이다. API 규격은 [테스트 서버 스웨거](https://test.clodycorp.com/swagger-ui/index.html#/)에서 확인할 수 있다.

## 발송 데이터

백그라운드·앱 종료 상태에서 시스템이 알림을 표시할 수 있도록 FCM HTTP v1 요청에 `notification`을 포함한다. 이동 정보는 `data`에 문자열로 전달한다.

```json
{
  "message": {
    "token": "기기의 FCM 토큰",
    "notification": {
      "title": "클로디의 답장이 도착했어요",
      "body": "오늘의 답장을 확인해 보세요."
    },
    "data": {
      "type": "reply",
      "date": "2026-11-12"
    },
    "android": {
      "notification": {
        "channel_id": "default"
      }
    }
  }
}
```

| `data` | 클릭 후 이동 |
| --- | --- |
| `type: "reply"`, 실제 달력에 존재하는 `date: "YYYY-MM-DD"` | 해당 날짜 답장 |
| `type: "diary"` 또는 `type: "diary_reminder"` | 일기 작성 |
| 데이터 없음, 모르는 종류, 잘못된 날짜 | 메인 |

서버가 보내는 임의 URL이나 화면 경로는 실행하지 않는다. 위 이동 데이터는 클라이언트가 지원하는 규격이며, 실제 발송 서버에서 같은 필드를 넣어야 한다. `notification`만 보내도 기본 메인 진입은 가능하다. 데이터만 있는 메시지는 운영체제의 자동 알림 표시 대상이 아니다.

## 실기기 확인

1. Android 13 이상과 iOS에서 로그인·회원가입 도중에는 권한을 요청하지 않고, 온보딩 완료 후 홈 진입 시 시스템 알림 권한 창이 표시되는지 확인한다. 기존 허용 상태는 앱 업데이트 후에도 유지되므로 시스템 창이 반복 표시되지 않는다.
2. 허용한 기기로 Firebase Console의 단일 기기 테스트 알림 또는 테스트 서버의 해당 사용자 대상 발송을 사용한다. 전체 사용자 방송 API는 테스트에 사용하지 않는다.
3. 앱 실행 중, 백그라운드, 앱 종료 상태에서 각각 표시와 클릭 후 이동을 확인한다. Android 앱 실행 중에는 로컬 복사가 한 번만 표시되고, iOS에서는 원격 알림의 배너·알림 센터·소리가 표시되는지 확인한다. iOS에서 사용자가 앱을 강제 종료한 상태의 데이터 메시지 등은 운영체제 정책에 영향을 받는다.
4. 답장 날짜, 일기 알림, 데이터 없는 알림을 각각 클릭한다. 로그아웃 상태에서 클릭한 경우 인증 흐름을 건너뛰지 않는지 확인한다.
5. 시스템 설정에서 권한을 변경한 뒤 앱으로 돌아왔을 때와 토큰 갱신 시 서버의 토큰이 반영되는지 확인한다.
6. 로그아웃 후 기존 토큰 대상으로 알림이 더 이상 전달되지 않는지 확인하고, 재로그인 후 새 토큰으로 다시 확인한다.

강제 업데이트 모달은 별도 이슈의 작업 범위다.

## iOS 시뮬레이터 검증 범위

iOS 시뮬레이터에서도 알림 권한 요청과 수신·클릭 리스너를 활성화한다. Android 에뮬레이터와 Expo Go는 기존처럼 지원 대상에서 제외한다. FCM 토큰은 시뮬레이터에서도 APNs 토큰이 실제로 준비됐을 때만 요청하므로, 시뮬레이터 실행 성공을 FCM 등록 성공으로 간주하지 않는다.

[Apple의 Xcode 14 릴리스 노트](https://developer.apple.com/documentation/xcode-release-notes/xcode-14-release-notes)에는 Apple Silicon/T2 Mac의 macOS 13·iOS 16 이상에서 시뮬레이터가 APNs Sandbox를 지원한다고 명시되어 있다. 이 프로젝트가 고정한 [React Native Firebase 23.8.8](https://github.com/invertase/react-native-firebase/blob/v23.8.8/packages/messaging/ios/RNFBMessaging/RNFBMessagingModule.m#L289)도 ARM64 시뮬레이터에서 등록을 시도한다. 실제 등록·수신 가능 여부는 실행 환경과 APNs 설정을 확인해야 한다.

`xcrun simctl push`로 알림을 주입할 때에는 `aps`와 함께 고유한 최상위 `gcm.message_id`를 넣어 RNFB의 수신·클릭 이벤트로 전달되게 한다. 라우팅용 `type`·`date`도 최상위 필드로 전달한다. 이 검증은 알림 UI와 앱의 이벤트 처리를 확인하며, FCM/APNs 전송 경로나 서버의 예약 발송을 검증하지 않는다. APNs 토큰을 임의 문자열로 대체해 성공으로 기록하지 않는다.


### 실행 결과 (2026-11-12)

별도로 생성한 iPhone 16e / iOS 26.1 시뮬레이터에서 `feat/#46`만 prebuild·Pods 설치·서명된 Debug 네이티브 빌드 후 검증했다. 위 `forceStaticLinking` 설정으로 RNFB framework의 React 헤더 오류를 해결했고, SecureStore 초기화와 로그인 화면 진입을 확인했다.

- 시스템 알림 권한 창 표시와 허용 동작 확인. 실제 가입을 만들지 않고 개발용 임시 호출로 권한 API를 실행했으므로 온보딩 전체 흐름의 실행 검증으로 기록하지 않는다.
- `simctl push`로 앱 실행 중 배너 표시, 백그라운드·프로세스 종료 후 배너 클릭과 앱 진입 확인.
- 백그라운드·종료 상태 모두 RNFB 클릭 콜백에서 주입한 메시지 ID와 `diary_reminder` 데이터를 수신했다. 로그아웃 상태에서 로그인 화면을 유지해 인증을 우회하지 않는 것 확인.
- 최초 허용 대기 중 등록 제한 시간이 경과했으나, 앱을 다시 시작한 뒤 FCM 토큰 준비 여부가 `true`인 것 확인. 토큰 원문은 출력하지 않았다.

위 수신·클릭 테스트는 시뮬레이터에 주입한 알림으로 수행했다. 실제 FCM/APNs를 통한 전송, 로그인 계정의 목적 화면 이동, 온보딩 완료 시점의 권한 요청, iOS 실기기 수신 및 07:10 예약 발송은 이 결과에 포함하지 않는다. 알림 센터 제스처 자동화가 실패해 배너를 직접 클릭하는 방식으로 검증했으며, 알림 센터 클릭은 확인하지 않았다. 임시 권한 호출과 확인용 로그는 검증 후 소스에서 제거했다.

회귀 검사는 `npm run test:notifications` 49개(알림 라우팅·토큰 동기화 11, 네이티브 클라이언트 22, 온보딩 5, 인증 7, Android manifest 4)와 TypeScript·변경 파일 ESLint로 확인한다. Android manifest 테스트는 새 prebuild에서 Expo가 메타데이터를 나중에 추가하는 순서에도 Firebase 병합 재정의가 유지되는지 포함한다.

## 예약 알림: 백엔드 수정 대기

2026-11-12에 서버 `stage` 커밋 `8dadb8144c8de1ebadafbdaa27cd7a57dc656760`을 읽기 전용으로 조사했다. [AlarmUpdateRequest.getParsedTime](https://github.com/Team-Clody/Clody_server/blob/8dadb8144c8de1ebadafbdaa27cd7a57dc656760/clody-app/src/main/java/com/clody/clodyapi/alarm/adapter/in/web/dto/AlarmUpdateRequest.java#L39)은 `time` 생략 시 `23:30`을 반환하며, [Alarm.updateAlarm](https://github.com/Team-Clody/Clody_server/blob/8dadb8144c8de1ebadafbdaa27cd7a57dc656760/clody-domain/src/main/java/com/clody/domain/alarm/core/domain/model/Alarm.java#L89)이 이를 저장한다. 따라서 명세상 허용된 `{fcmToken}` 단독 갱신도 선택 시간을 덮어쓴다. 조사한 DTO를 실행해 이 동작을 재현했고, 실기기 세션의 서버 조회값도 `23:30`이었다. 배포 서버의 정확한 커밋과 발송 로그는 확인하지 않았다.

백엔드에서 생략한 `time`을 `null`로 유지하고, 잘못된 시간은 검증 오류로 처리해야 한다. 토큰만 변경·동의만 변경 시 기존 시간 유지, 명시적 시간 변경 시 해당 시간 저장을 회귀 테스트로 확인한다. 앱의 GET 후 시간 재전송으로 우회하면 다른 요청과 경합할 수 있어 적용하지 않았다.

실제 FCM 테스트 메시지는 Android에서 실행 중·백그라운드·프로세스 종료 상태의 수신을 확인했다. 예약 시간 발송은 완료로 판정하지 않았으며, 사용자 요청에 따라 백엔드 수정 전까지 추가 예약 테스트를 중단한다. 개발 클라이언트의 프로세스 종료 후 알림 클릭에서는 빈 화면이 관찰되어, 별도 번들 빌드에서 재검증이 필요하다. 백엔드 수정 후에는 기존 계정도 원하는 시간을 다시 저장하고, 재실행·토큰 갱신 후 시간이 유지되는지와 해당 시각의 실제 도착을 확인한다.

## 참고

- [React Native Firebase Messaging](https://rnfirebase.io/messaging/usage)
- [iOS Messaging 설정과 APNs 연결](https://rnfirebase.io/messaging/usage/ios-setup)
- [설치된 AdMob v16의 Expo static framework 설정](https://github.com/invertase/react-native-google-mobile-ads/blob/v16.0.0/docs/index.mdx#optionally-configure-ios-static-frameworks)
