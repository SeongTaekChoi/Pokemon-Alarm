# 포켓몬 알람

포켓몬이 깨워 주는 안드로이드 알람 앱입니다. React Native 0.88 + Kotlin으로 만들었고, 본인 폰에 설치해서 쓰는 용도입니다.

## 기능 (1단계)

- 알람 여러 개: 시간, 특정 날짜 1회 또는 요일 반복
- 알람 소리: 포켓몬 울음소리(1세대 151종, 타입 필터와 검색) 또는 폰 벨소리
- 진동, 점점 크게, 다시 울림 (5분 울린 뒤 끄지 않으면 5분 뒤 다시, 최대 3번)
- 화면이 꺼져 있거나 잠겨 있어도 전체 화면으로 울림
- 재부팅, 시간대 변경 후 자동으로 다시 예약

## 기능 (2단계)

- 홈 필드: 들판, 숲, 바다, 설원 배경 위를 최대 20마리가 돌아다님. 하늘은 시간대(아침/낮/저녁/밤)에 맞춰 바뀜
- 포켓몬을 터치하면 울음소리와 함께 점프, 회전, 흔들기, 커지기 중 하나를 함
- 포켓몬 고르기: 1,025종, 타입 필터와 검색
- 배경 고르기: 직접 선택하거나 시간대마다 다른 배경 지정
- 랜덤 이벤트(20~45초마다): 비(한쪽으로 모여 떨기), 졸음(밤에 더 자주), 열매(달려가서 먹기), 야생 포켓몬 등장(❗), 몬스터볼(따라가기)

## 구조

| 위치 | 내용 |
| --- | --- |
| `android/app/src/main/java/com/seongtaek/pokealarm/alarm/` | 네이티브 알람 엔진. 예약(`AlarmScheduler`), 울림(`AlarmService`), 울림 화면(`AlarmActivity`), 재부팅 복구(`BootReceiver`), JS 연결(`AlarmModule`) |
| `src/screens/` | 홈, 알람 목록, 알람 설정, 알람 소리 고르기, 권한 안내, 울림 화면 |
| `src/field/` | 홈 필드: 배경 그림(SVG), 돌아다니는 포켓몬, 랜덤 이벤트 |
| `src/data/pokemon.json` | 1,025종 한국어/영어 이름, 타입, 세대. `scripts/build-pokemon-data.mjs`로 PokeAPI CSV에서 생성 |

알람 목록은 네이티브(SharedPreferences)에 저장되고, 앱이 꺼져 있어도 네이티브 코드만으로 울립니다.

## 에셋

포켓몬 이미지와 울음소리는 [PokeAPI](https://github.com/PokeAPI/pokeapi)에서 받아 씁니다. 저장소에는 파일을 넣지 않고, 알람을 저장할 때 울음소리를 폰에 내려받아 둡니다. 그래서 알람은 인터넷이 없어도 울립니다. 포켓몬 관련 저작권과 상표권은 Nintendo, Creatures, GAME FREAK, The Pokémon Company에 있습니다.

## 실행

준비: Node 22, JDK 17, Android Studio(Android SDK), USB 디버깅을 켠 폰.

```sh
npm install
npm run android        # 폰을 연결한 상태에서 개발 빌드 설치 + 실행
```

PC 없이 단독으로 실행되는 APK를 만들려면 (JS가 APK 안에 들어감):

```sh
cd android && ./gradlew assembleRelease
adb install app/build/outputs/apk/release/app-release.apk
```

GitHub Actions도 PR마다 이 APK(`pokealarm-apk`)를 만들어 실행 화면 아래 Artifacts에 올립니다.

처음 실행하면 알람 목록 위에 권한 안내가 뜹니다. 알림, 정확한 알람, 전체 화면 알림을 모두 켜 주세요.

## 테스트

```sh
npx tsc --noEmit && npm run lint && npm test
```

절전 상태에서 울리는지 확인하려면 알람을 1~2분 뒤로 맞추고 화면을 끈 다음:

```sh
adb shell dumpsys deviceidle force-idle
```
