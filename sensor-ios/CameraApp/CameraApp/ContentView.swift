//
//  ContentView.swift
//  CameraApp
//
//  Created by Yevin Dissanayake on 2/21/26.
//

import SwiftUI
import SmartSpectraSwiftSDK

struct ContentView: View {
    @ObservedObject private var sdk = SmartSpectraSwiftSDK.shared

    private let apiKey = "vr4A2pbftf4qrI4HOU2mOaLy2Kb6qYFn5CNZbwfp"

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

            if let metrics = sdk.metricsBuffer {
                let pulse = metrics.pulse.rate.last?.value
                let breath = metrics.breathing.rate.last?.value

                VStack(spacing: 6) {
                    Text("Pulse: \(pulse ?? 0, specifier: "%.0f") BPM")
                    Text("Breathing: \(breath ?? 0, specifier: "%.0f") RPM")
                }
                .font(.headline)
            } else {
                Text("Waiting for metrics…")
            }
        }
        .padding()
    }
}
