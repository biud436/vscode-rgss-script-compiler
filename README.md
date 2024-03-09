# Introduction

This extension allows you to edit scripts directly in Visual Studio Code without using the script editor of `RPG Maker VX Ace` or `RPG Maker XP`.

## Features

-   **Automatic Saving and Compilation**: Pressing `CTRL + S` saves your files and compiles your code automatically, so you don't have to worry about losing your progress.

-   **Test Play**: Pressing `F5` allows you to quickly test your code without having to run any additional commands.

## Screenshots

<p align="center">

![scr2](https://github.com/biud436/vscode-rgss-script-compiler/assets/13586185/dee8d4c2-fc9a-467a-bec8-765b91453973)
![scr3](https://github.com/biud436/vscode-rgss-script-compiler/assets/13586185/64ab60a3-b55f-4b15-86b3-57318bc41cef)
![scr1](https://github.com/biud436/vscode-rgss-script-compiler/assets/13586185/44b1371c-2ddd-4acb-b608-030e1c504c49)

</p>

# System Requirements

## Windows

-   Ruby version 2.6.8 or higher must be installed on your system.

## Mac

-   Ruby 2.6.10 or higher must be installed on your system.
-   [MKXP-Z](https://github.com/mkxp-z/mkxp-z)

## Linux

-   Ruby version 2.6.8 or higher must be installed on your system.
-   Wine (preferably the latest version)

# Marketplace Link

-   [https://marketplace.visualstudio.com/items?itemName=biud436.rgss-script-compiler](https://marketplace.visualstudio.com/items?itemName=biud436.rgss-script-compiler)

# Caution

-   Only one parent folder is allowed in the workspace. If there are multiple folders, only the top-level folder will be recognized.
-   The workspace is not automatically set to the initial game folder. This is because the workspace and game folders may be different.
-   This extension is not always active. The Game.ini file must be located in the root game folder to activate it.
-   The extension will activate the remaining buttons only when a game folder is selected. However, if the rgss-compiler.json file exists, it will be automatically activated. When VS Code starts up, the Import or Compile button will be automatically activated if this file exists.
-   Do not compile scripts while RPG Maker XP or RPG Maker VX Ace is running.

# Supported tools

-   RPG Maker XP
-   RPG Maker VX Ace

# Usage

This extension is designed for use on macOS, Windows 11 and Linux. Before using this extension, you must first install `ruby 2.6.8` or higher on your local machine.

To check if Ruby is installed on your computer, run this command in your terminal or command prompt:

```bash
ruby -v
```

Ruby comes pre-installed on Mac, so you can ignore this step if you're on a Mac. I tried using a Node module like `Marshal` or a WASM-based Ruby because I didn't want to require a Ruby installation, but they were not stable.

If Ruby is installed properly, you should see the version number displayed (e.g., `ruby 3.2.1`).

If running this extension on Linux you will also need to install `Wine` on your system to support testing the game.

To check if Wine is installed in your system you can run this command:

```bash
wine --version
```

# Maintainer and Contributors

-   Extension Maintainer

    -   Biud436 (https://github.com/biud436)

-   Contributors

    -   SnowSzn (PR [#21](https://github.com/biud436/vscode-rgss-script-compiler/pull/21))

-   `RGSS3/plugins/rxscript.rb`

    -   Korokke (gksdntjr714@naver.com)

-   `RGSS3/modules/Table.rb`

    -   CaptainJet (https://github.com/CaptainJet/RM-Gosu)

-   `RGSS3/RPG.rb`
    -   Yoji Ojima (Gotcha Gotcha Games, KADOKAWA)
