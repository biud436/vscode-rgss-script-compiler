# Introduction

This extension allows you to edit scripts directly in Visual Studio Code without using the script editor of RPG Maker VX Ace or RPG Maker XP.

[![IMG](https://img.youtube.com/vi/0uqOVCvXC-E/0.jpg)](https://youtu.be/0uqOVCvXC-E)

This extension is a beta version that has not been tested elaborately. We have secured stability by correcting problems such as third-party scripts, but please back up the scripts in advance.

## Marketplace Link

-   [https://marketplace.visualstudio.com/items?itemName=biud436.rgss-script-compiler](https://marketplace.visualstudio.com/items?itemName=biud436.rgss-script-compiler)

## Caution

-   There must be only one parent folder in the workspace (if there are more than one, the top folder is recognized only)
-   The workspace is not automatically set to the initial game folder(This is because workspace and game folders may be different)
-   This extension is not always active. Game.ini file must be in the root game folder to be activated.
-   This extension activates the rest of the buttons only when selecting the game folder. However, if the rgss-compiler.json file exists, it is automatically activated. When VS Code is started up, the Import or Compile button is automatically activated when this file is existed.
-   You should not compile scripts while RPG Maker XP or RPG Maker VX Ace is on. the script information in RPG Maker exists in the state of a global variable in memory based on the initial imported file content (Scripts.rvdata2), and does not detect that the file has been changed. To manipulate memory based on the contents of the file, it is beyond this extension because it requires heap memory manipulation in the tool, such as CreateRemoteThread or DLL Injection to directly penetrate the target process and implement a kind of Hack, such as the RPG Maker tool's Virtual Memory. When loaded with RGSS301.dll, etc. using CreateRemoteThread, one thread is executed, and if you hang a specific script at that time, you can implement Hack like as cheat engine.

## Known Issues

This is a list of bugs that we know but have not solved.

-   In some cases, the rest of the buttons are activated only when the game folder setting button is pressed more than once. (In some cases, RGSS version identification and game folder setting information are reflected in the setting file are executed separately.

This bug occurred by changing the synchronization function to an asynchronous function.

## Supported tools

-   RPG Maker XP
-   RPG Maker VX Ace

## Usage

This extension is designed for use in macOS and Windows 11. Before starting this extension, first up, Please you must install Ruby v2.6.8 or above on you local machine. Here's how to check if Ruby is installed on your computer.

To run this extension, Ruby must be installed on your computer (Mac is in the default installation state, so you can ignore it). I tried using a node module such as `marshal` or a WASM-based ruby. because I don't want a ruby installation. but they were not stable.

Try this command on your terminal or command prompt.

```bash
ruby -v
```

You call the command above to see if the ruby version is output normally like as `v2.6.8`

# Maintainer and Contributors

-   Extension Maintainer

    -   Biud436 (https://github.com/biud436)

-   `RGSS3/plugins/rxscript.rb`

    -   Korokke (gksdntjr714@naver.com)

-   `RGSS3/modules/Table.rb`

    -   CaptainJet (https://github.com/CaptainJet/RM-Gosu)

-   `RGSS3/RPG.rb`
    -   Yoji Ojima (Gotcha Gotcha Games, KADOKAWA)
