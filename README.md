# Introduction

`RGSS Script Compiler` is the extension of Text Editor called `Visual Studio Code`. if you are using this extension, you can modify script files and create the bundle file called `Scripts.rvdata2` in `Visual Studio Code` without internal Script Editor directly.

<p style="text-align:center">
<img width="2016" alt="image" src="https://user-images.githubusercontent.com/13586185/156922009-39d4b686-cd9b-463b-9884-3c42d806486e.png">
</p>

# Usage

본 확장은 macOS 와 Windows에서 사용할 수 있도록 설계되었습니다. RPG Maker VX Ace의 제한된 기능으로는 편집할 수 없습니다. 따라서 컴퓨터에 최신 Ruby v2.6.8 이상을 설치해야 합니다.

```bash
ruby -v
```

위 명령어를 호출하여 루비 버전이 정상적으로 출력되는 지 확인하세요.

이 확장은 명령어 기반으로 동작합니다.

## 게임 폴더 설정

Ctrl (Cmd) + Shift + P 를 누르고, `rgss-script-compiler: Set Game Path`을 선택하여 게임 폴더를 설정하세요.

## 스크립트 가져오기

Ctrl (Cmd) + Shift + P 를 누르고, `rgss-script-compiler: Unpack`을 선택하여 스크립트 파일을 역직렬화(Deserialize)합니다.

## 스크립트 저장하기

스크립트를 편집하고, Ctrl (Cmd) + Shift + P 를 누르면, `rgss-script-compiler: Compile`을 선택하여 스크립트 파일을 직렬화(Serialize)할 수 있습니다.

# Maintainer and Contributors

-   Extension Maintainer

    -   Biud436 (https://github.com/biud436)

-   `RGSS3/plugins/rxscript.rb`

    -   Korokke (gksdntjr714@naver.com)

-   `RGSS3/modules/Table.rb`

    -   CaptainJet (https://github.com/CaptainJet/RM-Gosu)

-   `RGSS3/RPG.rb`
    -   Yoji Ojima (Gotcha Gotcha Games, KADOKAWA)
