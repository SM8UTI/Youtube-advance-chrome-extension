# 🚀 YouTube Duration Filter

A premium Chrome Extension designed to transform your YouTube experience into a focused learning environment. Filter out distractions and find exactly the videos you need based on their duration.

## ✨ Key Features

- **🎯 Precision Filtering**: Filter search results and home feed videos by specific duration ranges (e.g., Short < 5min, Deep Dive > 1hr).
- **🛠️ Custom Ranges**: Set your own minimum and maximum duration limits in minutes or hours.
- **🛡️ Multi-Type Enforcement**: Automatically restricts search results to "Videos" when duration filters are active to exclude playlists and channels.
- **🧹 Smart Clean**: Dynamically hides Shorts, Ads, and filler content to maintain a sleek interface.
- **🏷️ Visual Badges**: Enhanced duration badges for quick scannability.
- **🔔 Toast Notifications**: Elegant desktop-style notifications when no results match your criteria.

## 🏗️ Architecture

The extension is built with a modular, scalable architecture:

- **`FilterEngine`**: The core logic handler for scanning and processing video metadata.
- **`VideoTypeEnforcer`**: URL-level enforcement for YouTube native filters.
- **`ObserverManager`**: Optimized MutationObserver to handle YouTube's dynamic SPA content loading.
- **`UIPanel`**: A floating, modern control center for real-time configuration.

## 🚀 Installation

1. Clone this repository.
2. Open Chrome and navigate to `chrome://extensions`.
3. Enable **Developer mode**.
4. Click **Load unpacked** and select the extension directory.

## 📄 License

MIT License - feel free to use and modify!

---
*Created with ❤️ for a better YouTube experience.*
