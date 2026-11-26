# MarkText — 개인 포크 (mermaid 다이어그램 확대·이동)

> **This is an unofficial personal fork of [MarkText](https://github.com/marktext/marktext).**
> It adds inline zoom and drag-to-pan for rendered diagrams (mermaid etc.). It is not affiliated
> with or endorsed by the MarkText project. For the official app, documentation and support, visit
> the [official repository](https://github.com/marktext/marktext) and [marktext.me](https://marktext.me).
> This fork is **not maintained or supported** and is provided "as is", without warranty of any kind.

이 저장소는 [marktext/marktext](https://github.com/marktext/marktext)를 포크해 개인적으로 수정한
**비공식 버전**입니다. 공식 MarkText 프로젝트와 관계가 없으며, 공식 프로젝트가 만들거나 보증한 것이
아닙니다. MarkText 자체의 소개, 사용법, 공식 설치 파일은 아래 [공식 프로젝트](#공식-프로젝트)를
참고하세요.

## 수정 사항

공식 `develop` 브랜치(0.24.0-dev, 커밋 `95a14e5c`) 위에 다음 기능을 추가했습니다. mermaid뿐 아니라
그려진 모든 다이어그램(flowchart, sequence, PlantUML, Vega-Lite)에 똑같이 적용됩니다.

| 기능                      | 사용법                                                                                                                                                                         |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 다이어그램 개별 확대/축소 | 다이어그램 위에서 `Ctrl`+휠(macOS는 `Cmd`+휠). 25%~500%. 다이어그램 밖의 `Ctrl`+휠은 기존처럼 창 전체를 확대/축소합니다.                                                       |
| 원래 크기로 되돌리기      | 확대/축소 중 오른쪽 아래에 나타나는 배지(예: `150% ⟲`)를 클릭합니다.                                                                                                           |
| 드래그 이동(패닝)         | 100%보다 크게 확대한 다이어그램을 왼쪽 버튼으로 끌면 보이는 영역이 움직입니다. 가로는 다이어그램 안을, 세로는 문서를 스크롤합니다.                                             |
| 코드 열기 방식 변경       | 그려진 다이어그램은 한 번 클릭해도 코드가 열리지 않습니다. 더블클릭하거나 툴바의 편집(연필) 버튼으로 엽니다. 비어 있거나 오류인 다이어그램은 기존처럼 한 번 클릭으로 열립니다. |

한 파일에 mermaid 다이어그램이 여러 개일 때 서로의 내용이 섞여 깨지던 문제(MarkText 0.19.x 이하)는
공식 프로젝트의 v0.20([#5465](https://github.com/marktext/marktext/pull/5465)),
v0.24([#6001](https://github.com/marktext/marktext/pull/6001))에서 이미 고쳐졌고, 이 포크에도
포함돼 있습니다.

변경된 소스는 `packages/muya/src/` 아래 다음 파일들입니다.

- `utils/diagram/zoom.ts`, `utils/diagram/pan.ts` — 확대/축소, 드래그 이동
- `block/extra/diagram/diagramPreview.ts` — 마우스 이벤트 연결, 클릭·더블클릭 동작
- `assets/styles/blockSyntax.css` — 스크롤, 커서, 배지 스타일

## 다운로드

[Releases](https://github.com/smileAllways/marktext/releases)에서 받을 수 있습니다.

- 설치되는 앱의 이름은 **MarkText Fork**이고, 아이콘 오른쪽 아래에 주황색 포크 배지가 있습니다. 공식
  MarkText와 앱 ID·설치 위치·파일 연결이 달라 함께 설치할 수 있습니다.
- 설정은 공식판과 같은 폴더(`%APPDATA%\marktext`)를 씁니다. 둘 중 하나를 제거할 때 "Do you want to
  delete user settings?"에 **아니요**를 고르세요. "예"를 고르면 함께 쓰는 설정이 지워집니다.
- **Windows x64용 설치 파일만** 제공합니다. macOS·Linux와 다른 아키텍처는 아래
  [직접 빌드하기](#직접-빌드하기)를 참고하세요.
- 코드 서명이 없어 처음 실행할 때 Windows SmartScreen 경고가 뜰 수 있습니다("추가 정보 → 실행").
- 앱 메뉴의 "업데이트 확인"에서 업데이트를 수락하면 공식판으로 바뀌어 위 기능이 사라집니다.
- 각 릴리스에 설치 파일의 SHA-256 값을 적어 두었습니다.

## 직접 빌드하기

빌드 방법은 공식 프로젝트와 같습니다. 자세한 준비 사항은
[공식 빌드 문서](https://marktext.me/docs/dev/build)를 참고하세요. Node.js 22.12 이상과 pnpm 10
이상이 필요합니다.

```bash
pnpm install
pnpm run dev            # 개발 모드로 실행
pnpm run build:win:x64  # Windows x64 설치 파일 (dist/ 폴더에 생성)
```

Windows에서 네이티브 모듈 `native-keymap`을 컴파일하려면 Visual Studio 2022에 **MSVC v143 Spectre
완화 라이브러리(x64/x86)** 구성 요소가 설치돼 있어야 합니다.

## 공식 프로젝트

MarkText 자체에 대한 정보, 사용법, 정식 설치 파일은 공식 프로젝트에서 확인하세요.

- 저장소: <https://github.com/marktext/marktext>
- 웹사이트·문서: <https://marktext.me>
- 정식 설치 파일: <https://github.com/marktext/marktext/releases>
- 공식 프로젝트 후원: <https://github.com/sponsors/marktext>

## 유지보수·지원 안내 (면책)

- 이 포크는 개인 사용을 위해 만든 것으로, **유지보수하거나 지원하는 프로젝트가 아닙니다.** 이슈·문의·기능
  요청을 받지 않으며, 공식 프로젝트의 업데이트를 따라가거나 보안 수정을 반영한다는 보장도 없습니다.
- 이 포크의 코드와 설치 파일은 MIT 라이센스에 따라 **있는 그대로(AS IS)** 제공되며, 어떠한 보증도 하지
  않습니다. 사용으로 생기는 문제나 손해에 대해 이 포크의 작성자는 책임지지 않습니다.
- 앱 메뉴의 "문제 보고"는 공식 MarkText 이슈 페이지로 연결됩니다. 버그를 발견하면 먼저
  [공식 설치 파일](https://github.com/marktext/marktext/releases)에서도 같은 문제가 생기는지 확인하고,
  공식판에서도 재현될 때만 공식 프로젝트에 신고해 주세요. 이 포크에서만 생기는 문제(위
  [수정 사항](#수정-사항) 관련)는 공식 프로젝트에 올리지 말아 주세요.
- 안정적인 사용과 지원이 필요하면 [공식 MarkText](https://github.com/marktext/marktext)를 사용하세요.

## 라이센스

MarkText는 [MIT 라이센스](LICENSE)이며, 이 포크도 같은 조건으로 배포합니다.

```
Copyright (c) 2017-present Luo Ran
Copyright (c) 2018-present MarkText Contributors
```

"MarkText" 이름과 로고는 원 프로젝트의 것입니다.
