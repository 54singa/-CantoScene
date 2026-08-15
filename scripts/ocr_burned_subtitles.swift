import CoreGraphics
import Foundation
import ImageIO
import Vision

struct OCRRow: Codable {
    let time: Double
    let texts: [String]
}

guard CommandLine.arguments.count >= 3 else {
    FileHandle.standardError.write(Data("Usage: ocr_burned_subtitles.swift <frames-directory> <output.json>\n".utf8))
    exit(2)
}

let framesURL = URL(fileURLWithPath: CommandLine.arguments[1], isDirectory: true)
let outputURL = URL(fileURLWithPath: CommandLine.arguments[2])
let fileManager = FileManager.default
let frames = try fileManager.contentsOfDirectory(
    at: framesURL,
    includingPropertiesForKeys: nil,
    options: [.skipsHiddenFiles]
).compactMap { url -> (URL, Double)? in
    let filename = url.lastPathComponent
    guard filename.hasPrefix("frame-"), filename.hasSuffix(".png") else { return nil }
    let start = filename.index(filename.startIndex, offsetBy: 6)
    let end = filename.index(filename.endIndex, offsetBy: -4)
    guard let time = Double(filename[start..<end]) else { return nil }
    return (url, time)
}.sorted { $0.1 < $1.1 }

var rows: [OCRRow] = []
for (url, time) in frames {
    autoreleasepool {
        guard let source = CGImageSourceCreateWithURL(url as CFURL, nil),
              let image = CGImageSourceCreateImageAtIndex(source, 0, nil),
              let subtitleImage = image.cropping(to: CGRect(
                x: 0,
                y: Int(Double(image.height) * 0.68),
                width: image.width,
                height: Int(Double(image.height) * 0.32)
              )) else {
            FileHandle.standardError.write(Data("Unable to read \(url.path)\n".utf8))
            return
        }

        let request = VNRecognizeTextRequest()
        request.recognitionLevel = .accurate
        request.recognitionLanguages = ["zh-Hant", "zh-Hans", "en-US"]
        request.usesLanguageCorrection = true
        request.minimumTextHeight = 0.018
        request.regionOfInterest = CGRect(x: 0.08, y: 0.0, width: 0.84, height: 1.0)

        do {
            try VNImageRequestHandler(cgImage: subtitleImage, options: [:]).perform([request])
            let texts = (request.results ?? []).compactMap { observation in
                observation.topCandidates(1).first?.string.trimmingCharacters(in: .whitespacesAndNewlines)
            }.filter { !$0.isEmpty }
            rows.append(OCRRow(time: time, texts: texts))
        } catch {
            FileHandle.standardError.write(Data("OCR failed for \(url.lastPathComponent): \(error)\n".utf8))
        }
    }
}

let encoder = JSONEncoder()
encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
let data = try encoder.encode(rows)
try fileManager.createDirectory(at: outputURL.deletingLastPathComponent(), withIntermediateDirectories: true)
try data.write(to: outputURL, options: .atomic)
print("Saved \(rows.count) OCR samples to \(outputURL.path)")
