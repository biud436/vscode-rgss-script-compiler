# Version Log


## 0.9.0 - 30 Aug 2023

### Fixed

- Fixed an issue that prevented extensions from being activated because of the database.

## 0.8.1 - 07 Jul 2023 

### New Features

-   Added a Script Explorer that allows users to add, remove, and refresh script files ([#14](https://github.com/biud436/vscode-rgss-script-compiler/issues/14))
-   Added a feature to hide the status bar.
-   Added MKXP-Z support on Mac.
-   Debug mode support ([#16](https://github.com/biud436/vscode-rgss-script-compiler/issues/16))
-   Added Linux support (PR [#21](https://github.com/biud436/vscode-rgss-script-compiler/pull/21))

## 0.0.12 - 22 Mar 2022

### New Features

- Added a feature that can execute game when pressing the key called `F5` (#3)
- Added a feature that can compile ruby files automatically when pressing the key called `ctrl + s` (#2)

## 0.0.10 - 09 Mar 2022

### Added

- Added a new feature that can open the game folder in the visual studio code's workspace.
- Allow the user to import scripts for RPG Maker XP on Windows or MacOS.
- `README.md` was supplemented by using a translator.

## 0.0.5 - 08 Mar 2022

### Fixed

- Removed `*` event that means to start the extension unconditionally when starting up the `vscode`

## 0.0.4 - 07 Mar 2022

### Fixed

- Fixed the language of the hard coded logger message as in English.
- Fixed the issue that line break character is changed empty string in `plugins/rxscript.tb`
- Changed export folder name as `Scripts`

## 0.0.3 - 07 Mar 2022

### Added

- Added a new event that can detect a file named `Game.ini` in the workspace folder.

### Fixed

- Fixed the language of the hard coded logger message as in English.
