# Introduction

This extension allows you to edit scripts directly in Visual Studio Code without using the script editor of `RPG Maker VX Ace` or `RPG Maker XP`.

## Features

-   **Automatic Saving and Compilation**: Pressing `CTRL + S` saves your files and compiles your code automatically, so you don't have to worry about losing your progress.

-   **Test Play (Windows Only)**: Pressing `F5` allows you to quickly test your code on Windows without having to run any additional commands.

## Screenshots

<p align="center">

<img width="1041" alt="image" src="https://github.com/biud436/vscode-rgss-script-compiler/assets/13586185/d64945cd-6479-40e7-9d12-e5edc9c85cd0">

</p>

![rgss-compiler-preview](https://user-images.githubusercontent.com/13586185/186309563-f5d00d1c-c9bb-4b93-8bb1-e98f888d705c.gif)

This extension is a beta version that has not been tested elaborately. We have secured stability by correcting problems such as third-party scripts, but please back up the scripts in advance.

# System Requirements

-   Ruby version 2.6.8 or higher must be installed on your system.

# Change Log

## 0.1.0

### New Features

-   Added a Script Explorer that allows users to add, remove, and refresh script files.
-   Added a feature to hide the status bar.

# Marketplace Link

-   [https://marketplace.visualstudio.com/items?itemName=biud436.rgss-script-compiler](https://marketplace.visualstudio.com/items?itemName=biud436.rgss-script-compiler)

# Caution

-   Only one parent folder is allowed in the workspace. If there are multiple folders, only the top-level folder will be recognized.
-   The workspace is not automatically set to the initial game folder. This is because the workspace and game folders may be different.
-   This extension is not always active. The Game.ini file must be located in the root game folder to activate it.
-   The extension will activate the remaining buttons only when a game folder is selected. However, if the rgss-compiler.json file exists, it will be automatically activated. When VS Code starts up, the Import or Compile button will be automatically activated if this file exists.
-   Do not compile scripts while RPG Maker XP or RPG Maker VX Ace is running. The script information in RPG Maker exists in the form of a global variable in memory based on the initial imported file content (Scripts.rvdata2), and does not detect changes made to the file. Manipulating memory based on the contents of the file requires heap memory manipulation in the tool, such as CreateRemoteThread or DLL Injection to directly penetrate the target process and implement a kind of hack, such as the RPG Maker tool's Virtual Memory. When loaded with RGSS301.dll, etc. using CreateRemoteThread, one thread is executed, and if you attach a specific script at that time, you can implement a hack like a cheat engine.

# Supported tools

-   RPG Maker XP
-   RPG Maker VX Ace

# Usage

This extension is designed for use on macOS and Windows 11. Before using this extension, you must first install `ruby 2.6.8` or higher on your local machine. Here's how to check if Ruby is already installed:

To use this extension, you must have Ruby installed on your computer (Ruby comes pre-installed on Mac, so you can ignore this step if you're on a Mac). I tried using a Node module like `Marshal` or a WASM-based Ruby because I didn't want to require a Ruby installation, but they were not stable.

To check if Ruby is installed on your computer, run this command in your terminal or command prompt:

```bash
ruby -v
```

If Ruby is installed properly, you should see the version number displayed (e.g., `ruby 3.2.1`).

# Maintainer and Contributors

-   Extension Maintainer

    -   Biud436 (https://github.com/biud436)

-   `RGSS3/plugins/rxscript.rb`

    -   Korokke (gksdntjr714@naver.com)

-   `RGSS3/modules/Table.rb`

    -   CaptainJet (https://github.com/CaptainJet/RM-Gosu)

-   `RGSS3/RPG.rb`
    -   Yoji Ojima (Gotcha Gotcha Games, KADOKAWA)
