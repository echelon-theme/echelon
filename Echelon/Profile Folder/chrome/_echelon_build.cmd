@echo off

where npm >nul 2>nul
if (%ERRORLEVEL% equ 0) (
	echo Node.js is not installed. Please install that and rerun the script.
	pause
	exit
)

pushd echelon-scss-src\buildenv

:: Ensure all NPM packages are installed

npm install --dry-run | findstr /C:"up to date"

if (%ERRORLEVEL% equ 1) (
	echo Node packages outdated. Installing.
	call npm install --include=dev
)

:: Build package
set BUILD_ARG=build
if not "%1"=="" (
	set BUILD_ARG=%1
)

call .\node_modules\.bin\gulp %BUILD_ARG%

popd
