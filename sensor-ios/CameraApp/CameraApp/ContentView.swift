//
//  ContentView.swift
//  CameraApp
//
//  Created by Yevin Dissanayake on 2/21/26.
//

import SwiftUI
import SmartSpectraSwiftSDK
import Combine

struct ContentView: View {
    @ObservedObject private var sdk = SmartSpectraSwiftSDK.shared

    private let apiKey = "vr4A2pbftf4qrI4HOU2mOaLy2Kb6qYFn5CNZbwfp"

    private let backendURL = URL(string: "http://10.190.10.99:4000/metrics")!

    private let tick = Timer.publish(every: 1.0, on: .main, in: .common).autoconnect()

    init()
    {
        sdk.setApiKey(apiKey)
    }

    var body: some View
    {
        VStack(spacing: 12)
        {
            SmartSpectraView()
                .frame(maxWidth: .infinity, maxHeight: 420)
                .clipShape(RoundedRectangle(cornerRadius: 16))

            Divider()

            if let metrics = sdk.metricsBuffer
            {
                let pulse = Double(metrics.pulse.rate.last?.value ?? 0)
                let breath = Double(metrics.breathing.rate.last?.value ?? 0)

                VStack(spacing: 6)
                {
                    Text("Pulse: \(pulse, specifier: "%.0f") BPM")
                    Text("Breathing: \(breath, specifier: "%.0f") RPM")
                }
                .font(.headline)

            }
            else
            {
                Text("Waiting for metrics…")
            }
        }
        .padding()
        .onReceive(tick)
        {
            _ in
            guard let metrics = sdk.metricsBuffer else { return }

            let pulse = Double(metrics.pulse.rate.last?.value ?? 0)
            let breath = Double(metrics.breathing.rate.last?.value ?? 0)

            guard pulse > 0, breath > 0 else { return }

            sendMetrics(pulse: pulse, breathing: breath)
        }
    }

    private func sendMetrics(pulse: Double, breathing: Double)
    
    {
        let payload: [String: Any] = [
            "heartRate": pulse,
            "breathingRate": breathing
        ]

        var request = URLRequest(url: backendURL)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try? JSONSerialization.data(withJSONObject: payload)

        URLSession.shared.dataTask(with: request).resume()
    }
}
