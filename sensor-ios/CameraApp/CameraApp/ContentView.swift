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

    @State private var pulseWindow: [Double] = []
    @State private var breathWindow: [Double] = []
    @State private var confidenceWindow: [Double] = []

    @State private var trendSlope: Double = 0.0

    private let windowSize: Int = 30
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

                let micro = metrics.face.microExpression.last
                let faceTracked = micro != nil
                let confidence = Double(micro?.confidence ?? 0)
                let isStable = micro?.stable ?? false

                VStack(spacing: 6)
                {
                    Text("Pulse: \(pulse, specifier: "%.0f") BPM")
                    Text("Breathing: \(breath, specifier: "%.0f") RPM")

                    Divider().padding(.vertical, 4)

                    Text("Confidence: \(confidence * 100, specifier: "%.0f")%")
                    Text("Face Tracking: \(faceTracked ? "Yes" : "No")")
                    Text("Stable: \(isStable ? "Yes" : "No")")

                    Text("Trend slope: \(trendSlope, specifier: "%.4f")")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
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
            let micro = metrics.face.microExpression.last
            let confidence = Double(micro?.confidence ?? 0)

            push(pulse, into: &pulseWindow)
            push(breath, into: &breathWindow)
            push(confidence, into: &confidenceWindow)

            trendSlope = computeAggregateTrendSlope()
        }
    }

    private func push(_ value: Double, into arr: inout [Double])
    {
        arr.append(value)
        if arr.count > windowSize
        {
            arr.removeFirst(arr.count - windowSize)
        }
    }

    private func slope(_ arr: [Double]) -> Double
    {
        guard arr.count >= 2 else { return 0 }
        return (arr.last! - arr.first!) / Double(arr.count - 1)
    }

    private func clamp(_ x: Double, _ lo: Double, _ hi: Double) -> Double
    {
        min(max(x, lo), hi)
    }

    private func normalizedSlope(_ s: Double, typicalRange: Double) -> Double
    {
        guard typicalRange > 0 else { return 0 }
        return clamp(s / typicalRange, -1, 1)
    }

    private func computeAggregateTrendSlope() -> Double
    {
        let pSlope = normalizedSlope(slope(pulseWindow), typicalRange: 2.0)
        let bSlope = normalizedSlope(slope(breathWindow), typicalRange: 0.5)
        let cSlope = normalizedSlope(slope(confidenceWindow), typicalRange: 0.05)

        return (0.45 * pSlope) + (0.35 * bSlope) + (0.20 * cSlope)
    }
}
