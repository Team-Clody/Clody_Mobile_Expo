# 강제 업데이트

Firebase Remote Config의 기존 `rn_update_version_hard`를 설치된 앱 버전과 비교한다. 앱 버전은 `expo-application`의 네이티브 버전을 우선 사용하며, 필수 버전보다 낮을 때 로그인·홈 화면을 렌더링하지 않고 강제 업데이트 모달을 표시한다. 같거나 높은 버전은 정상 진입한다. 숫자로 비교하므로 `2.10.0`은 `2.9.0`보다 높다.

업데이트 안내는 `Alert.alert`로 운영체제의 기본 시스템 팝업을 사용한다. 스토어 이동과 업데이트 재확인 버튼을 제공하며, 버튼을 누르면 시스템이 팝업을 닫는 동안에도 앱 화면은 계속 차단한다. 스토어 이동 실패와 앱 복귀 시에는 안내를 다시 표시한다.

## 설정

현재 Firebase 프로젝트의 Remote Config에서 아래 값을 지정한다. iOS와 Android의 출시 버전이 다르면 Firebase의 플랫폼 조건으로 값을 구분한다.

| 키 | 값 |
| --- | --- |
| `rn_update_version_hard` | 필수 최소 버전. 예: `2.1.0`. 빈 값은 강제 업데이트 해제 |
| `app_update_store_url_android` | 해당 앱의 공식 Google Play 상세 페이지 HTTPS 주소 |
| `app_update_store_url_ios` | 해당 앱의 공식 App Store 상세 페이지 HTTPS 주소 |

`rn_update_version_soft`는 기존 계약대로 읽고 판정하지만, 이번 작업은 강제 업데이트만 표시한다. 권장 업데이트 팝업은 연결하지 않는다. 버전은 `2.1.0`과 같은 세 부분 숫자 형식을 사용한다. 없거나 잘못된 버전 값으로 앱을 차단하지 않는다.

스토어 주소는 Remote Config 값을 우선한다. 빌드 시 `EXPO_PUBLIC_ANDROID_STORE_URL`, `EXPO_PUBLIC_IOS_STORE_URL`을 지정하면 앱 기본 주소를 대체한다. iOS는 `https://apps.apple.com/.../id숫자`, Android는 `https://play.google.com/store/apps/details?id=패키지` 형식이다. 설치 패키지에서 임의로 주소를 생성하지 않는다.

사용자가 제공한 실제 출시 주소를 앱 기본값으로 연결했다: [Google Play (`com.sopt.clody`)](https://play.google.com/store/apps/details?id=com.sopt.clody&hl=ko), [App Store (`6511215518`)](https://apps.apple.com/kr/app/%ED%81%B4%EB%A1%9C%EB%94%94-%ED%96%89%EC%9A%B4%EC%9D%84-%EC%A0%84%ED%95%98%EB%8A%94-%EA%B0%90%EC%82%AC%EC%9D%BC%EA%B8%B0/id6511215518). 개발 앱의 Android 패키지는 출시 패키지와 달라도 이 주소로 상세 페이지를 열 수 있다. 필수 버전을 올리기 전에 해당 버전의 스토어 배포를 확인한다. 스토어를 열지 못하면 재시도 안내를 표시하고 차단을 유지한다. 이 구현은 Firebase 설정을 읽기만 하며 원격 값을 게시하지 않는다.

## 동작

- 앱 시작과 앱 복귀 시 확인한다. 첫 확인 전에는 앱 화면을 표시하지 않는다.
- 조회는 전체 5초로 제한한다. 통신 실패·시간 초과 시 Firebase의 활성화된 캐시를 사용한다. 캐시도 없는 최초 실행은 정상 진입한다.
- 운영 자동 조회 간격은 1시간, 개발 빌드는 즉시 조회한다. 모달의 ‘업데이트 다시 확인’은 캐시 간격을 우회해 정책 해제를 바로 확인할 수 있다.
- Android 뒤로가기, 모달 바깥 터치, 스토어 이동 성공·실패로 차단을 해제하지 않는다. 앱 복귀 후 버전 조건이 충족되거나 정책이 해제되어야 정상 진입한다.
- 웹은 네이티브 스토어 업데이트 검사 없이 진입한다.

## 빌드와 검증

Firebase 네이티브 모듈이 추가되어 Expo Go 대신 새 개발 빌드가 필요하다. `google-services.json`과 동일한 Firebase 프로젝트의 iOS용 `GoogleService-Info.plist`를 루트에 준비한다. 파일 경로는 `GOOGLE_SERVICES_JSON` / `GOOGLE_SERVICES_PLIST`로 대체할 수 있다. iOS는 static frameworks를 사용한다.

Expo SDK 54의 React 헤더와 호환되도록 `forceStaticLinking`에 `RNFBApp`, `RNFBAnalytics`, `RNFBRemoteConfig`를 지정한다. Firebase SDK는 static frameworks를 유지하고, React 헤더를 사용하는 RNFB 모듈만 정적 라이브러리로 연결한다. 이 설정은 새 prebuild에도 적용된다.

```bash
npm ci
npm run test:updates
npx expo run:android --device
```

실기기 테스트에서는 로컬 코드에만 임시 필수 버전 `99.0.0`을 넣어 모달 표시, 뒤로가기·배경 터치 차단, 스토어 오류 후 유지, 앱 복귀 및 정책 해제 후 진입을 확인한다. 테스트 설정은 코드에서 제거하며, 검증을 위해 전체 사용자의 Remote Config 값을 바꾸지 않는다.

2026-11-12 연결된 Android 13 기기에서 시스템 팝업 표시·뒤로가기와 바깥 터치 차단·재확인 후 팝업 유지·정책 해제 후 정상 진입, 카카오·구글 로그인 버튼 표시를 확인했다. 개발 APK 빌드·설치, 정책 테스트 21개와 시스템 팝업 테스트 12개, 전체 TypeScript 검사, Android/iOS JavaScript 번들 생성이 통과했다. 시스템 팝업 버튼으로 실제 클로디 Google Play 상세 페이지가 열리고 앱 복귀 후에도 차단이 유지되는 것을 확인했다. iOS 주소는 공식 페이지와 URL 검증으로 확인했으며, iOS 실기기 실행은 아직 확인하지 않았다.


### iOS 시뮬레이터 결과 (2026-11-12)

별도로 생성한 iPhone 16e / iOS 26.1 시뮬레이터에서 `feat/#47`을 단독으로 prebuild·Pods 설치·서명된 Debug 네이티브 빌드 후 확인했다. RNFB 모듈의 framework 헤더 오류를 위 `forceStaticLinking` 설정으로 해결했다. 시뮬레이터 서명을 포함한 빌드에서 SecureStore 초기화와 로그인 화면 진입을 확인했다.

- 정상 정책에서 카카오·Apple 로그인 버튼 표시 확인.
- 로컬 임시 최소 버전 `99.0.0`으로 기본 시스템 팝업 표시, 취소 동작 없음, 재확인 후 차단 유지 확인.
- 스토어 버튼으로 앱을 벗어나 Safari로 이동하고, 앱 복귀 후 시스템 팝업과 차단이 유지되는 것 확인.
- 재확인으로 임시 정책을 해제한 뒤 정상 로그인 화면 진입 확인.

스토어 왕복 테스트 중 Safari에 주소가 유효하지 않다는 오류가 표시되어 **App Store 상세 페이지 렌더링은 검증하지 못했다**. 이 검증 항목은 통과로 기록하지 않으며, iOS 실기기의 App Store 이동·업데이트 설치를 별도로 확인해야 한다. 실제 Firebase Remote Config는 변경하지 않았고 임시 정책 코드는 모두 제거했다.

참고: [React Native Firebase Remote Config](https://rnfirebase.io/remote-config/usage).
