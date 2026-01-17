import BarcodeScanning, { BarcodeFormat } from '@react-native-ml-kit/barcode-scanning';
import TextRecognition, { TextBlock } from '@react-native-ml-kit/text-recognition';

/**
 * Interface for ML Kit Barcode Scan Result
 */
export interface MLKitBarcodeResult {
    value: string | null;
    format: BarcodeFormat;
}

/**
 * Interface for ML Kit OCR Result
 */
export interface MLKitOCRResult {
    text: string;
    blocks: TextBlock[];
}

/**
 * Scan barcodes/QR codes from a local image file
 * @param imageUri - Local file path to the image
 * @returns Array of detected barcodes
 */
export const scanBarcodes = async (imageUri: string): Promise<MLKitBarcodeResult[]> => {
    try {
        const result = await BarcodeScanning.scan(imageUri);
        return result.map(barcode => ({
            value: barcode.value || null,
            format: barcode.format
        }));
    } catch (error) {
        console.error('ML Kit Barcode Scan Error:', error);
        return [];
    }
};

/**
 * Recognize text (OCR) from a local image file
 * @param imageUri - Local file path to the image
 * @returns OCR result containing full text and blocks
 */
export const recognizeText = async (imageUri: string): Promise<MLKitOCRResult | null> => {
    try {
        const result = await TextRecognition.recognize(imageUri);
        return {
            text: result.text,
            blocks: result.blocks
        };
    } catch (error) {
        console.error('ML Kit OCR Error:', error);
        return null;
    }
};

/**
 * Extracts URLs from OCR text
 * @param text - Raw text from OCR
 * @returns Array of unique URLs found
 */
export const extractUrlsFromText = (text: string): string[] => {
    const urlRegex = /(https?:\/\/[^\s]+)/gi;
    const matches = text.match(urlRegex) || [];
    return Array.from(new Set(matches)); // Unique URLs
};
