# ReinventingThreatDetection

NOTE: Ensure app is not run on WSU Network due to firewall restrictions, out team ran the app on a personal hotspot for best results.

Team: 
- Hiruna Yevin Dissanayake 
- Kevin Herrera
- Levi Chapman

About:
Threat visualization and assessment software.
- IOS camera application: detects target and captures vitals, vitals are then transmitted to back end
- Back end: Calculates risk score and risk level from gathered data and established live feed to front end dash board
- Dashboard: Renders current risk, metrics and live feed of camera with risk level of target.

IOS APP: 
- Swift and SwiftUI
- Presage Technologies SmartSpectraSwiftSDK for vitals
- Sends metrics to backend

Back end (http://localhost:8080/):
- Node.js
- Express
- Socket.IO to push to dashboard

Dashboard (http://localhost:3000/):
- Next.js
- React
- socket.IO client
- CSS

Example payload from json
{
	"heartRate": 70,
	"breathingRate": 15,
	"stressIndex": 0.5
	"engagement": 1.0,
	"frameBase64": ... (Camera data for live preview of subject)
}

Build and Run
Front End: 
- cd dashboard/
- npm install
- npm run dev
- runs on http://localhost:3000/

Back End: 
- cd backend/
- npm install
- npm run dev
- runs on http://localhost:8080/

IOS App: Build and Run through Xcode
