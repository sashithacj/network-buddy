# Network Buddy
Network Buddy is an Electron application designed to visualize network activity in real time in MacOS. Users can see active connections, including IP addresses and countries, along with the amount of data being transmitted and received. The app provides a unique perspective on network traffic.

![Screenshot](./screenshot.png)

## Features
- **Real-time Network Monitoring**: Visualize your network activity in real time. See which applications are connecting to the internet and how much data they are transmitting.
- **Geolocation Data**: Identify the geographical location of your connections. Network Buddy displays the country, and, when available, the city and region of the IP addresses your applications are connected to.
- **Data Usage Insights**: Keep track of the data usage with detailed statistics on the amount of data sent and received by each application.
- **Globe Visualization**: A dynamic globe visualization showcases your global network connections, making it easy to identify where in the world your data is going to or coming from.
- **Customizable Interface**: The application features a customizable interface, allowing users to toggle the visibility of the globe visualization and adjust the app's appearance to their liking.
- **Tray Icon for Quick Access**: Access Network Buddy quickly from the tray icon, where you can also adjust settings or close the application.

## Prerequisites
- Node.js (v14 or later recommended)
- npm (comes with Node.js)
- Electron

## Installation
Clone this repository and then follow the instructions below:

```bash
npm install
npm start
```

## Packaging
If you want to generate the distributable package for this app, run the following command:

```bash
npm run package
```

This will generate the required files for various platforms such as macOS, Windows and Linux.

## Contributing
Contributions are welcome! Please feel free to submit a pull request.

## License
This project is licensed under the terms of the MIT license. See [LICENSE](LICENSE) for more details.
