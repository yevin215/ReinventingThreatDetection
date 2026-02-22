import SwiftUI
import UIKit
import SmartSpectraSwiftSDK

struct ContentView: View {
    @ObservedObject private var sdk = SmartSpectraSwiftSDK.shared

    private let apiKey = "3tPS4qXYHXaLQvvlw7CrO6Trk9D60OJa19YQ39yN"
    private let backendURL = "https://threat-detection-backend-production.up.railway.app/metrics"

    @State private var lastSentAt: Date = .distantPast
    private let sendInterval: TimeInterval = 0.25

    @State private var stressIndex: Double = 0
    @State private var engagement: Double = 1.0
    @State private var riskScore: Double?
    @State private var riskLevel: String?

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
                let pulse = Double(metrics.pulse.rate.last?.value ?? 0)
                let breath = Double(metrics.breathing.rate.last?.value ?? 0)

                VStack(spacing: 8) {
                    Text("Pulse: \(pulse, specifier: "%.0f") BPM")
                    Text("Breathing: \(breath, specifier: "%.0f") RPM")

                    Text("Stress Index: \(stressIndex, specifier: "%.2f")")
                    Text("Engagement: \(engagement, specifier: "%.2f")")

                    if let riskScore {
                        Text("Risk Score: \(riskScore, specifier: "%.0f")")
                    }
                    if let riskLevel {
                        Text("Risk Level: \(riskLevel)")
                            .font(.headline)
                    }
                }
                .font(.headline)
            } else {
                Text("Waiting for metrics…")
            }
        }
        .padding()
        .onReceive(sdk.$metricsBuffer) { metrics in
            guard let metrics else { return }

            let pulse = Double(metrics.pulse.rate.last?.value ?? 0)
            let breath = Double(metrics.breathing.rate.last?.value ?? 0)

            let computedStress = min(1.0, max(0.0, (pulse - 60.0) / 60.0))
            let computedEngagement = 1.0

            stressIndex = computedStress
            engagement = computedEngagement

            guard pulse > 0 else { return }

            let now = Date()
            guard now.timeIntervalSince(lastSentAt) >= sendInterval else { return }
            lastSentAt = now

            let frame = captureScreenJPEGBase64(maxWidth: 360, quality: 0.15)
            print("frameBase64 length:", frame?.count ?? 0)

            sendMetrics(
                heartRate: pulse,
                breathingRate: breath,
                stressIndex: computedStress,
                engagement: computedEngagement,
                frameBase64: frame
            )
        }
    }

    struct MetricsRequest: Codable {
        let heartRate: Double
        let breathingRate: Double
        let stressIndex: Double
        let engagement: Double
        let frameBase64: String?
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

    private func captureScreenJPEGBase64(maxWidth: CGFloat = 480, quality: CGFloat = 0.25) -> String? {
        guard let image = captureKeyWindowImage() else { return nil }
        let resized = resizeImage(image, maxWidth: maxWidth)
        guard let jpegData = resized.jpegData(compressionQuality: quality) else { return nil }
        return jpegData.base64EncodedString()
    }
    
    private func captureKeyWindowImage() -> UIImage? {
        guard let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene else { return nil }
        guard let window = windowScene.windows.first(where: { $0.isKeyWindow }) else { return nil }

        let renderer = UIGraphicsImageRenderer(bounds: window.bounds)
        return renderer.image { _ in
            window.drawHierarchy(in: window.bounds, afterScreenUpdates: false)
        }
    }

    private func resizeImage(_ image: UIImage, maxWidth: CGFloat) -> UIImage {
        let size = image.size
        guard size.width > maxWidth else { return image }

        let scale = maxWidth / size.width
        let newSize = CGSize(width: maxWidth, height: size.height * scale)

        let renderer = UIGraphicsImageRenderer(size: newSize)
        return renderer.image { _ in
            image.draw(in: CGRect(origin: .zero, size: newSize))
        }
    }

    func sendMetrics(
        heartRate: Double,
        breathingRate: Double,
        stressIndex: Double,
        engagement: Double,
        frameBase64: String?
    ) {
        guard let url = URL(string: backendURL) else { return }

        let payload = MetricsRequest(
            heartRate: heartRate,
            breathingRate: breathingRate,
            stressIndex: stressIndex,
            engagement: engagement,
            frameBase64: frameBase64
        )

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        do {
            request.httpBody = try JSONEncoder().encode(payload)
        } catch {
            print("Encode failed:", error.localizedDescription)
            return
        }

        URLSession.shared.dataTask(with: request) { data, response, error in
            if let error {
                print("Send failed:", error.localizedDescription)
                return
            }

            if let http = response as? HTTPURLResponse {
                print("/metrics status:", http.statusCode)
            }

            guard let data else { return }

            if let decoded = try? JSONDecoder().decode(MetricsResponse.self, from: data) {
                DispatchQueue.main.async {
                    self.riskScore = decoded.riskScore
                    self.riskLevel = decoded.riskLevel
                }
            } else if let text = String(data: data, encoding: .utf8) {
                print("/metrics raw response:", text.prefix(500))
            }
        }
        .resume()
    }
}
