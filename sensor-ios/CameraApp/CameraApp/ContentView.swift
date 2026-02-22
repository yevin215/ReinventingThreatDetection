import SwiftUI
import SmartSpectraSwiftSDK

struct ContentView: View {
    @ObservedObject private var sdk = SmartSpectraSwiftSDK.shared
    private let apiKey = "vr4A2pbftf4qrI4HOU2mOaLy2Kb6qYFn5CNZbwfp"
    private let backendURL = "https://threat-detection-backend-production.up.railway.app/metrics"

    init() {
        sdk.setApiKey(apiKey)
    }

    var body: some View {
        VStack(spacing: 12) {
            SmartSpectraView()
                .frame(maxWidth: .infinity, maxHeight: 420)
                .clipShape(RoundedRectangle(cornerRadius: 16))

            Divider()

            if let metrics = sdk.metricsBuffer {
                let pulse = metrics.pulse.rate.last?.value ?? 0
                let breath = metrics.breathing.rate.last?.value ?? 0

                VStack(spacing: 6) {
                    Text("Pulse: \(pulse, specifier: "%.0f") BPM")
                    Text("Breathing: \(breath, specifier: "%.0f") RPM")
                }
                .font(.headline)
            } else {
                Text("Waiting for metrics…")
            }
        }
        .padding()
        .onReceive(sdk.$metricsBuffer) { metrics in
            guard let metrics = metrics else { return }

            let pulse = Double(metrics.pulse.rate.last?.value ?? 0)
            let breath = Double(metrics.breathing.rate.last?.value ?? 0)

            // Prevent sending empty frames
            if pulse > 0 {
                sendMetrics(heartRate: pulse, breathingRate: breath)
            }
        }
    }

    func sendMetrics(heartRate: Double, breathingRate: Double) {
        guard let url = URL(string: backendURL) else { return }

        let payload: [String: Any] = [
            "heartRate": heartRate,
            "breathingRate": breathingRate,
            "stressIndex": min(1.0, max(0, (heartRate - 60) / 60)),
            "engagement": 1.0
        ]

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try? JSONSerialization.data(withJSONObject: payload)

        URLSession.shared.dataTask(with: request) { _, _, error in
            if let error = error {
                print("❌ Send failed:", error.localizedDescription)
            } else {
                print("✅ Sent — HR: \(heartRate), BR: \(breathingRate)")
            }
        }.resume()
    }
}