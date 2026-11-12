# 강제 업데이트

Firebase Remote Config의 기존 `rn_update_version_hard`를 설치된 앱 버전과 비교한다. 앱 버전은 `expo-application`의 네이티브 버전을 우선 사용하며, 필수 버전보다 낮을 때 로그인·홈 화면을 렌더링하지 않고 강제 업데이트 모달을 표시한다. 같거나 높은 버전은 정상 진입한다. 숫자로 비교하므로 `2.10.0`은 `2.9.0`보다 높다.

## 설정

현재 Firebase 프로젝트의 Remote Config에서 아래 값을 지정한다. iOS와 Android의 출시 버전이 다르면 Firebase의 플랫폼 조건으로 값을 구분한다.

| 키 | 값 |
| --- | --- |
| `rn_update_version_hard` | 필수 최소 버전. 예: `2.1.0`. 빈 값은 강제 업데이트 해제 |
| `app_update_store_url_android` | 해당 앱의 공식 Google Play 상세 페이지 HTTPS 주소 |
| `app_update_store_url_ios` | 해당 앱의 공식 App Store 상세 페이지 HTTPS 주소 |

`rn_update_version_soft`는 기존 계약대로 읽고 판정하지만, 이번 작업은 강제 업데이트만 표시한다. 권장 업데이트 팝업은 연결하지 않는다. 버전은 `2.1.0`과 같은 세 부분 숫자 형식을 사용한다. 없거나 잘못된 버전 값으로 앱을 차단하지 않는다.

스토어 주소는 Remote Config 값을 우선한다. 빌드 시 `EXPO_PUBLIC_ANDROID_STORE_URL`, `EXPO_PUBLIC_IOS_STORE_URL`을 지정하면 주소의 기본값으로 쓴다. iOS는 `https://apps.apple.com/.../id숫자`, Android는 `https://play.google.com/store/apps/details?id=패키지` 형식이다. 설치 패키지에서 임의로 주소를 생성하지 않는다. 이 Expo 앱의 Android 패키지는 기존 출시 앱과 다르므로 **실제로 배포할 앱의 주소를 먼저 확인해야 한다.**

실제 스토어 주소는 아직 제공되지 않아 빈 기본값으로 두었다. 필수 버전을 올리기 전에 플랫폼별 주소와 해당 버전의 스토어 배포를 확인한다. 주소가 없거나 스토어를 열지 못하면 사용자에게 재시도 안내를 표시하고 차단을 유지한다. 이 구현은 Firebase 설정을 읽기만 하며 원격 값을 게시하지 않는다.

## 동작

- 앱 시작과 앱 복귀 시 확인한다. 첫 확인 전에는 앱 화면을 표시하지 않는다.
- 조회는 전체 5초로 제한한다. 통신 실패·시간 초과 시 Firebase의 활성화된 캐시를 사용한다. 캐시도 없는 최초 실행은 정상 진입한다.
- 운영 자동 조회 간격은 1시간, 개발 빌드는 즉시 조회한다. 모달의 ‘업데이트 다시 확인’은 캐시 간격을 우회해 정책 해제를 바로 확인할 수 있다.
- Android 뒤로가기, 모달 바깥 터치, 스토어 이동 성공·실패로 차단을 해제하지 않는다. 앱 복귀 후 버전 조건이 충족되거나 정책이 해제되어야 정상 진입한다.
- 웹은 네이티브 스토어 업데이트 검사 없이 진입한다.

## 빌드와 검증

Firebase 네이티브 모듈이 추가되어 Expo Go 대신 새 개발 빌드가 필요하다. `google-services.json`과 동일한 Firebase 프로젝트의 iOS용 `GoogleService-Info.plist`를 루트에 준비한다. 파일 경로는 `GOOGLE_SERVICES_JSON` / `GOOGLE_SERVICES_PLIST`로 대체할 수 있다. iOS는 static frameworks를 사용한다.

```bash
npm ci
npm run test:updates
npx expo run:android --device
```

실기기 테스트에서는 로컬 코드에만 임시 필수 버전 `99.0.0`을 넣어 모달 표시, 뒤로가기·배경 터치 차단, 스토어 오류 후 유지, 앱 복귀 및 정책 해제 후 진입을 확인한다. 테스트 설정은 코드에서 제거하며, 검증을 위해 전체 사용자의 Remote Config 값을 바꾸지 않는다.

2026-11-12 연결된 Android 13 기기에서 위 항목과 카카오·구글 로그인 버튼 표시를 확인했다. 개발 APK 빌드·설치, 테스트 21개, 전체 TypeScript 검사, Android/iOS JavaScript 번들 생성이 통과했다. 실제 스토어 상세 페이지 이동과 iOS 실기기 실행은 아직 확인하지 않았다.

참고: [React Native Firebase Remote Config](https://rnfirebase.io/remote-config/usage).
