import SwiftUI
import SmartSpectraSwiftSDK

struct ContentView: View {
    @ObservedObject private var sdk = SmartSpectraSwiftSDK.shared

    private let apiKey = "vr4A2pbftf4qrI4HOU2mOaLy2Kb6qYFn5CNZbwfp"
    private let backendURL = "https://threat-detection-backend-production.up.railway.app/metrics"

    @State private var stressIndex: Double = 0
    @State private var engagement: Double = 1.0
    @State private var riskScore: Double?
    @State private var riskLevel: String?

    init() {
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

                VStack(spacing: 8)
                {
                    Text("Pulse: \(pulse, specifier: "%.0f") BPM")
                    Text("Breathing: \(breath, specifier: "%.0f") RPM")

                    Text("Stress Index: \(stressIndex, specifier: "%.2f")")
                    Text("Engagement: \(engagement, specifier: "%.2f")")

                    if let riskScore
                    {
                        Text("Risk Score: \(riskScore, specifier: "%.0f")")
                    }
                    if let riskLevel
                    {
                        Text("Risk Level: \(riskLevel)")
                            .font(.headline)
                    }
                }
                .font(.headline)
            }
            else
            {
                Text("Waiting for metrics…")
            }
        }
        .padding()
        .onReceive(sdk.$metricsBuffer)
        {
            metrics in
            guard let metrics else { return }

            let pulse = Double(metrics.pulse.rate.last?.value ?? 0)
            let breath = Double(metrics.breathing.rate.last?.value ?? 0)

            let computedStress = min(1.0, max(0.0, (pulse - 60.0) / 60.0))
            let computedEngagement = 1.0

            stressIndex = computedStress
            engagement = computedEngagement

            if pulse > 0 {
                sendMetrics(
                    heartRate: pulse,
                    breathingRate: breath,
                    stressIndex: computedStress,
                    engagement: computedEngagement
                )
            }
        }
    }

    struct MetricsRequest: Codable {
        let heartRate: Double
        let breathingRate: Double
        let stressIndex: Double
        let engagement: Double
    }

    struct MetricsResponse: Codable {
        let status: String
        let heartRate: Double?
        let breathingRate: Double?
        let stressIndex: Double?
        let engagement: Double?
        let riskScore: Double?
        let riskLevel: String?
    }

    func sendMetrics(heartRate: Double, breathingRate: Double, stressIndex: Double, engagement: Double)
    {
        guard let url = URL(string: backendURL) else { return }

        let payload = MetricsRequest(
            heartRate: heartRate,
            breathingRate: breathingRate,
            stressIndex: stressIndex,
            engagement: engagement
        )

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        do
        {
            request.httpBody = try JSONEncoder().encode(payload)
        }
        catch
        {
            print("Encode failed:", error.localizedDescription)
            return
        }

        URLSession.shared.dataTask(with: request)
        {
            data, _, error in
            if let error
            {
                print("Send failed:", error.localizedDescription)
                return
            }

            guard let data else { return }

            if let decoded = try? JSONDecoder().decode(MetricsResponse.self, from: data)
            {
                DispatchQueue.main.async
                {
                    self.riskScore = decoded.riskScore
                    self.riskLevel = decoded.riskLevel
                }
            }
        }
        .resume()
    }
}
